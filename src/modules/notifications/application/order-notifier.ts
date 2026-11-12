import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Order } from '@/modules/orders/domain/entities/order.entity';
import { MAILER, Mailer } from '../domain/mailer';
import { OrderMail } from './order-mail.templates';

/** Fachada que usan los casos de uso de pedidos. Los envíos no se esperan: no frenan la respuesta. */
@Injectable()
export class OrderNotifier {
  private readonly frontend: string;

  constructor(@Inject(MAILER) private readonly mailer: Mailer, config: ConfigService) {
    this.frontend = config.get<string>('FRONTEND_URL', 'http://localhost:5173').replace(/\/$/, '');
  }

  private url(order: Order) {
    return `${this.frontend}/pedido/${order.id}`;
  }

  orderCreated(order: Order) {
    void this.mailer.send(OrderMail.created(order, this.url(order)));
  }
  orderPaid(order: Order) {
    void this.mailer.send(OrderMail.paid(order, this.url(order)));
  }
  orderShipped(order: Order) {
    void this.mailer.send(OrderMail.shipped(order, this.url(order)));
  }
}
