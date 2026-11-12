import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AuthUser } from '@/shared/auth/current-user';
import { ORDER_REPOSITORY, OrderRepository } from '../../domain/repositories/order.repository';

@Injectable()
export class GetOrderUseCase {
  constructor(@Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository) {}

  /** Un cliente solo ve sus pedidos; un invitado puede ver el suyo con el id (UUID no adivinable); admin ve todos. */
  async execute(orderId: string, user: AuthUser | null) {
    const order = await this.orders.findById(orderId);
    if (!order) throw new NotFoundException('Pedido no encontrado');
    const isOwner = order.userId === null || order.userId === user?.id;
    if (!isOwner && user?.role !== 'ADMIN') throw new ForbiddenException('Este pedido no es tuyo');
    return order;
  }
}
