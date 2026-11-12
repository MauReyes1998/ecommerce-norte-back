import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { canTransition, OrderStatus } from '../../domain/entities/order.entity';
import { ORDER_REPOSITORY, OrderRepository } from '../../domain/repositories/order.repository';
import { OrderNotifier } from '@/modules/notifications/application/order-notifier';

/** Lo usa el panel admin. Aplica la máquina de estados y regresa stock al cancelar. */
@Injectable()
export class UpdateOrderStatusUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository,
    private readonly notifier: OrderNotifier,
  ) {}

  async execute(orderId: string, status: OrderStatus, actor = 'admin', note?: string) {
    const order = await this.orders.findById(orderId);
    if (!order) throw new NotFoundException('Pedido no encontrado');
    if (!canTransition(order.status, status)) {
      throw new BadRequestException(`No se puede pasar de ${order.status} a ${status}`);
    }
    if (status === 'CANCELADO') await this.orders.restoreStock(orderId);
    const updated = await this.orders.updateStatus(orderId, status, actor, note);
    if (status === 'PAGADO') this.notifier.orderPaid(updated);
    if (status === 'ENVIADO') this.notifier.orderShipped(updated);
    return updated;
  }
}
