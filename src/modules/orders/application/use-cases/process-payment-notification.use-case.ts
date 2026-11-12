import { Inject, Injectable, Logger } from '@nestjs/common';
import { ORDER_REPOSITORY, OrderRepository } from '../../domain/repositories/order.repository';
import { PAYMENT_GATEWAY, PaymentGateway } from '../../domain/services/payment-gateway';
import { OrderNotifier } from '@/modules/notifications/application/order-notifier';

/**
 * Lo llama el webhook de Mercado Pago. Es idempotente: el mismo aviso puede llegar varias veces.
 * Nunca confía en el cuerpo del webhook; consulta el pago en Mercado Pago con el id recibido.
 */
@Injectable()
export class ProcessPaymentNotificationUseCase {
  private readonly logger = new Logger(ProcessPaymentNotificationUseCase.name);

  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository,
    @Inject(PAYMENT_GATEWAY) private readonly payments: PaymentGateway,
    private readonly notifier: OrderNotifier,
  ) {}

  async execute(paymentId: string) {
    const payment = await this.payments.fetchPayment(paymentId);
    if (!payment) {
      this.logger.warn(`Pago ${paymentId} no encontrado en el proveedor`);
      return { handled: false };
    }
    const order = await this.orders.findById(payment.orderId);
    if (!order) {
      this.logger.warn(`Pago ${paymentId} apunta a un pedido inexistente ${payment.orderId}`);
      return { handled: false };
    }

    if (payment.status === 'APPROVED' && order.status === 'PENDIENTE') {
      await this.orders.markPaid(order.id, payment.paymentId, 'APPROVED');
      this.logger.log(`Pedido ${order.number} pagado (pago ${payment.paymentId})`);
      this.notifier.orderPaid({ ...order, status: 'PAGADO', paymentStatus: 'APPROVED' });
    } else if (payment.status === 'REJECTED' && order.status === 'PENDIENTE') {
      await this.orders.markPaid(order.id, payment.paymentId, 'REJECTED');
    }
    return { handled: true };
  }
}
