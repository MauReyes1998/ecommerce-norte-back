import { Inject, Injectable } from '@nestjs/common';
import { ListOrdersQuery } from '../dto/order.dto';
import { ORDER_REPOSITORY, OrderRepository } from '../../domain/repositories/order.repository';

/** Lista para el panel admin, con filtro por estatus y búsqueda. */
@Injectable()
export class ListOrdersUseCase {
  constructor(@Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository) {}

  execute(query: ListOrdersQuery) {
    return this.orders.findMany({ status: query.status, search: query.search }, query.page, query.limit);
  }
}
