import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { toMoney } from '@/shared/utils/money';
import { CategorySales, DailySales, ProductSales, ReportsRepository } from '../../domain/reports.repository';

const PAID: OrderStatus[] = ['PAGADO', 'ENVIADO', 'ENTREGADO'];
const round = (n: number) => Math.round(n * 100) / 100;
const dayOf = (d: Date) => d.toISOString().slice(0, 10);

@Injectable()
export class PrismaReportsRepository implements ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async salesByDay(since: Date): Promise<DailySales[]> {
    const orders = await this.prisma.order.findMany({
      where: { status: { in: PAID }, createdAt: { gte: since } },
      select: { createdAt: true, subtotal: true, discount: true, shippingCost: true, total: true, items: { select: { quantity: true } } },
      orderBy: { createdAt: 'asc' },
    });
    const byDay = new Map<string, DailySales>();
    for (const o of orders) {
      const date = dayOf(o.createdAt);
      const row = byDay.get(date) ?? { date, orders: 0, units: 0, subtotal: 0, discount: 0, shipping: 0, revenue: 0 };
      row.orders += 1;
      row.units += o.items.reduce((a, i) => a + i.quantity, 0);
      row.subtotal += Number(o.subtotal);
      row.discount += Number(o.discount);
      row.shipping += Number(o.shippingCost);
      row.revenue += Number(o.total);
      byDay.set(date, row);
    }
    return [...byDay.values()].map((r) => ({ ...r, subtotal: round(r.subtotal), discount: round(r.discount), shipping: round(r.shipping), revenue: round(r.revenue) }));
  }

  async salesByProduct(since: Date): Promise<ProductSales[]> {
    const where = { order: { status: { in: PAID }, createdAt: { gte: since } } };
    const [sums, orders] = await Promise.all([
      this.prisma.orderItem.groupBy({ by: ['productId', 'productName'], where, _sum: { quantity: true, lineTotal: true } }),
      // Pedidos distintos por producto (un pedido con 3 piezas del mismo producto cuenta 1).
      this.prisma.orderItem.findMany({ where, select: { productId: true, orderId: true }, distinct: ['productId', 'orderId'] }),
    ]);
    const orderCount = new Map<string | null, number>();
    orders.forEach((o) => orderCount.set(o.productId, (orderCount.get(o.productId) ?? 0) + 1));
    return sums
      .map((s) => ({
        productId: s.productId, productName: s.productName,
        units: s._sum.quantity ?? 0, revenue: toMoney(s._sum.lineTotal) ?? 0, orders: orderCount.get(s.productId) ?? 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  async salesByCategory(since: Date): Promise<CategorySales[]> {
    const items = await this.prisma.orderItem.findMany({
      where: { order: { status: { in: PAID }, createdAt: { gte: since } } },
      select: { quantity: true, lineTotal: true, product: { select: { category: { select: { id: true, name: true } } } } },
    });
    const byCat = new Map<string | null, CategorySales>();
    for (const i of items) {
      const cat = i.product?.category ?? null;
      const key = cat?.id ?? null;
      const row = byCat.get(key) ?? { categoryId: key, categoryName: cat?.name ?? 'Sin categoría (producto eliminado)', units: 0, revenue: 0 };
      row.units += i.quantity;
      row.revenue += Number(i.lineTotal);
      byCat.set(key, row);
    }
    return [...byCat.values()].map((r) => ({ ...r, revenue: round(r.revenue) })).sort((a, b) => b.revenue - a.revenue);
  }
}
