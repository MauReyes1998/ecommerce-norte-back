import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Page } from '@/shared/pagination/pagination';
import { formatOrderNumber, Order } from '@/modules/orders/domain/entities/order.entity';
import { ORDER_REPOSITORY, OrderRepository } from '@/modules/orders/domain/repositories/order.repository';
import { ADMIN_CUSTOMER_REPOSITORY, AdminCustomerRepository } from '../../domain/admin.repository';
import { UpdateAdminOrderDto } from '../dto/admin.dto';

@Injectable()
export class AdminOrdersUseCases {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository,
    @Inject(ADMIN_CUSTOMER_REPOSITORY) private readonly customers: AdminCustomerRepository,
  ) {}

  async get(id: string) {
    const order = await this.orders.findById(id);
    if (!order) throw new NotFoundException('Pedido no encontrado');
    return order;
  }

  async updateFields(id: string, dto: UpdateAdminOrderDto) {
    await this.get(id);
    return this.orders.updateAdminFields(id, dto);
  }

  listCustomers(search: string | undefined, page: number, limit: number) {
    return this.customers.findMany(search, page, limit);
  }

  /** CSV para Excel: una fila por pedido. */
  toCsv(page: Page<Order>): string {
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const head = ['Pedido', 'Fecha', 'Cliente', 'Correo', 'Estatus', 'Pago', 'Artículos', 'Subtotal', 'Envío', 'Total', 'Descuento', 'Cupón', 'Entrega', 'Estado', 'CP', 'Guía'];
    const rows = page.items.map((o) => [
      formatOrderNumber(o.number), o.createdAt.toISOString().slice(0, 16).replace('T', ' '), o.shippingAddress.fullName, o.email,
      o.status, o.paymentStatus, o.items.reduce((a, i) => a + i.quantity, 0), o.subtotal, o.shippingCost, o.total,
      o.discount, o.couponCode ?? '', o.deliveryMethod === 'RECOGER' ? 'Recoger en tienda' : 'Domicilio', o.shippingAddress.state, o.shippingAddress.postalCode, o.trackingNumber ? `${o.trackingCarrier ?? ''} ${o.trackingNumber}`.trim() : '',
    ]);
    return '﻿' + [head, ...rows].map((r) => r.map(esc).join(',')).join('\r\n');
  }
}
