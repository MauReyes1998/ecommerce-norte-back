import { BadRequestException, ConflictException, Inject, Injectable, Logger } from '@nestjs/common';
import { QuoteCartUseCase } from '@/modules/cart/application/use-cases/quote-cart.use-case';
import { AuthUser } from '@/shared/auth/current-user';
import { CreateOrderDto } from '../dto/order.dto';
import { ORDER_REPOSITORY, OrderRepository, OutOfStockError } from '../../domain/repositories/order.repository';
import { PAYMENT_GATEWAY, PaymentGateway } from '../../domain/services/payment-gateway';
import { OrderNotifier } from '@/modules/notifications/application/order-notifier';

@Injectable()
export class CreateOrderUseCase {
  private readonly logger = new Logger(CreateOrderUseCase.name);

  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository,
    @Inject(PAYMENT_GATEWAY) private readonly payments: PaymentGateway,
    private readonly notifier: OrderNotifier,
    private readonly quoteCart: QuoteCartUseCase,
  ) {}

  async execute(dto: CreateOrderDto, user: AuthUser | null) {
    const email = user?.email ?? dto.email;
    if (!email) throw new BadRequestException('Indica un correo para recibir la confirmación');

    // 1. Recalcular todo en el servidor.
    const quote = await this.quoteCart.execute(dto.items);
    if (!quote.isValid) {
      throw new ConflictException({
        message: 'Algunos productos cambiaron de disponibilidad. Revisa tu carrito.',
        lines: quote.lines.filter((l) => l.issue !== 'OK'),
      });
    }

    // 2. Crear pedido y descontar stock en una transacción.
    let order;
    try {
      order = await this.orders.createWithStockDecrement({
        userId: user?.id ?? null,
        email,
        subtotal: quote.subtotal,
        shippingCost: quote.shippingCost,
        total: quote.total,
        shippingAddress: dto.shippingAddress,
        items: quote.lines.map((l) => ({
          productId: l.productId, variantId: l.variantId, productName: l.productName, sku: l.sku,
          size: l.size, color: l.color, unitPrice: l.unitPrice, quantity: l.quantity, lineTotal: l.lineTotal,
        })),
      });
    } catch (e) {
      if (e instanceof OutOfStockError) {
        throw new ConflictException(`Se acabó el stock de ${e.sku} mientras comprabas. Revisa tu carrito.`);
      }
      throw e;
    }

    // 3. Crear la sesión de pago. Si falla, el pedido queda PENDIENTE y se puede reintentar el pago.
    let checkout: { preferenceId: string; initPoint: string } | null = null;
    try {
      checkout = await this.payments.createCheckout(order);
      await this.orders.setPreference(order.id, checkout.preferenceId);
    } catch (e) {
      this.logger.error(`No se pudo crear el checkout del pedido ${order.id}: ${String(e)}`);
    }

    this.notifier.orderCreated(order);
    return { order, checkoutUrl: checkout?.initPoint ?? null };
  }
}
