import { Inject, Injectable } from '@nestjs/common';
import { ORDER_REPOSITORY, OrderRepository } from '../../domain/repositories/order.repository';

@Injectable()
export class ListMyOrdersUseCase {
  constructor(@Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository) {}

  execute(userId: string, page: number, limit: number) {
    return this.orders.findMany({ userId }, page, limit);
  }
}
