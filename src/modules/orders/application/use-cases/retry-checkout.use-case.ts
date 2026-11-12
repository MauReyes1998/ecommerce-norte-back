import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { AuthUser } from '@/shared/auth/current-user';
import { ORDER_REPOSITORY, OrderRepository } from '../../domain/repositories/order.repository';
import { PAYMENT_GATEWAY, PaymentGateway } from '../../domain/services/payment-gateway';
import { GetOrderUseCase } from './get-order.use-case';

/** Si el cliente cerró Mercado Pago sin pagar, vuelve a generar el link. */
@Injectable()
export class RetryCheckoutUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository,
    @Inject(PAYMENT_GATEWAY) private readonly payments: PaymentGateway,
    private readonly getOrder: GetOrderUseCase,
  ) {}

  async execute(orderId: string, user: AuthUser | null) {
    const order = await this.getOrder.execute(orderId, user);
    if (order.status !== 'PENDIENTE') throw new BadRequestException('Este pedido ya no está pendiente de pago');
    const checkout = await this.payments.createCheckout(order);
    await this.orders.setPreference(order.id, checkout.preferenceId);
    return { checkoutUrl: checkout.initPoint };
  }
}
