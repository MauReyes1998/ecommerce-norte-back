import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { Page } from '@/shared/pagination/pagination';
import { toMoney } from '@/shared/utils/money';
import { Order, OrderStatus, PaymentStatus, ShippingAddress } from '../../domain/entities/order.entity';
import { NewOrder, OrderListFilters, OrderRepository, OutOfStockError } from '../../domain/repositories/order.repository';

const include = {
  items: { include: { product: { select: { images: { orderBy: { sortOrder: 'asc' }, take: 1, select: { url: true } } } } } },
  history: { orderBy: { createdAt: 'asc' } },
} satisfies Prisma.OrderInclude;
type Row = Prisma.OrderGetPayload<{ include: typeof include }>;

function toOrder(row: Row): Order {
  return {
    id: row.id,
    number: row.number,
    userId: row.userId,
    email: row.email,
    status: row.status,
    subtotal: toMoney(row.subtotal) as number,
    shippingCost: toMoney(row.shippingCost) as number,
    total: toMoney(row.total) as number,
    discount: toMoney(row.discount) as number,
    couponCode: row.couponCode,
    shippingAddress: row.shippingAddress as unknown as ShippingAddress,
    deliveryMethod: row.deliveryMethod,
    paymentProvider: row.paymentProvider,
    paymentStatus: row.paymentStatus,
    mpPreferenceId: row.mpPreferenceId,
    mpPaymentId: row.mpPaymentId,
    paidAt: row.paidAt,
    trackingCarrier: row.trackingCarrier,
    trackingNumber: row.trackingNumber,
    adminNote: row.adminNote,
    history: row.history.map((h) => ({ id: h.id, fromStatus: h.fromStatus, toStatus: h.toStatus, note: h.note, actor: h.actor, createdAt: h.createdAt })),
    createdAt: row.createdAt,
    items: row.items.map((i) => ({
      id: i.id, productId: i.productId, variantId: i.variantId, productName: i.productName, sku: i.sku,
      size: i.size, color: i.color, unitPrice: toMoney(i.unitPrice) as number, quantity: i.quantity,
      lineTotal: toMoney(i.lineTotal) as number, imageUrl: i.product?.images[0]?.url ?? null,
    })),
  };
}

@Injectable()
export class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createWithStockDecrement(order: NewOrder): Promise<Order> {
    const row = await this.prisma.$transaction(async (tx) => {
      // updateMany con la condición stock >= cantidad: si afecta 0 filas, alguien ganó el último.
      for (const item of order.items) {
        const result = await tx.productVariant.updateMany({
          where: { id: item.variantId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (result.count === 0) throw new OutOfStockError(item.sku);
      }
      // El uso del cupón se cuenta en la misma transacción que el pedido.
      if (order.couponId) {
        await tx.coupon.update({ where: { id: order.couponId }, data: { usedCount: { increment: 1 } } });
      }
      return tx.order.create({
        data: {
          userId: order.userId,
          email: order.email,
          subtotal: order.subtotal,
          shippingCost: order.shippingCost,
          total: order.total,
          discount: order.discount,
          couponId: order.couponId,
          couponCode: order.couponCode,
          shippingAddress: order.shippingAddress as unknown as Prisma.InputJsonValue,
          deliveryMethod: order.deliveryMethod,
          items: { create: order.items },
          history: { create: { toStatus: 'PENDIENTE', actor: 'sistema', note: 'Pedido creado' } },
        },
        include,
      });
    });
    return toOrder(row);
  }

  async findById(id: string): Promise<Order | null> {
    const row = await this.prisma.order.findUnique({ where: { id }, include });
    return row ? toOrder(row) : null;
  }

  async findByNumber(number: number): Promise<Order | null> {
    const row = await this.prisma.order.findUnique({ where: { number }, include });
    return row ? toOrder(row) : null;
  }

  async findMany(filters: OrderListFilters, page: number, limit: number): Promise<Page<Order>> {
    const and: Prisma.OrderWhereInput[] = [];
    if (filters.userId) and.push({ userId: filters.userId });
    if (filters.status) and.push({ status: filters.status });
    if (filters.search) {
      const digits = filters.search.replace(/\D/g, '');
      and.push({
        OR: [
          { email: { contains: filters.search, mode: 'insensitive' } },
          ...(digits ? [{ number: Number(digits) }] : []),
        ],
      });
    }
    const where: Prisma.OrderWhereInput = { AND: and };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit, include }),
      this.prisma.order.count({ where }),
    ]);
    return { items: rows.map(toOrder), total, page, limit };
  }

  async setPreference(orderId: string, preferenceId: string): Promise<void> {
    await this.prisma.order.update({ where: { id: orderId }, data: { mpPreferenceId: preferenceId } });
  }

  async markPaid(orderId: string, paymentId: string, paymentStatus: PaymentStatus): Promise<Order> {
    const approved = paymentStatus === 'APPROVED';
    const row = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        mpPaymentId: paymentId,
        paymentStatus,
        ...(approved ? { status: 'PAGADO', paidAt: new Date() } : {}),
        history: {
          create: approved
            ? { fromStatus: 'PENDIENTE', toStatus: 'PAGADO', actor: 'mercadopago', note: `Pago ${paymentId} aprobado` }
            : { fromStatus: 'PENDIENTE', toStatus: 'PENDIENTE', actor: 'mercadopago', note: `Pago ${paymentId} rechazado` },
        },
      },
      include,
    });
    return toOrder(row);
  }

  async updateStatus(orderId: string, status: OrderStatus, actor = 'admin', note?: string): Promise<Order> {
    const current = await this.prisma.order.findUniqueOrThrow({ where: { id: orderId }, select: { status: true } });
    const row = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        ...(status === 'PAGADO' ? { paidAt: new Date(), paymentStatus: 'APPROVED' } : {}),
        history: { create: { fromStatus: current.status, toStatus: status, actor, note: note ?? null } },
      },
      include,
    });
    return toOrder(row);
  }

  async updateAdminFields(orderId: string, data: { trackingCarrier?: string | null; trackingNumber?: string | null; adminNote?: string | null }): Promise<Order> {
    const row = await this.prisma.order.update({ where: { id: orderId }, data, include });
    return toOrder(row);
  }

  async restoreStock(orderId: string): Promise<void> {
    const items = await this.prisma.orderItem.findMany({ where: { orderId, variantId: { not: null } } });
    await this.prisma.$transaction(
      items.map((i) =>
        this.prisma.productVariant.update({ where: { id: i.variantId as string }, data: { stock: { increment: i.quantity } } }),
      ),
    );
  }
}
