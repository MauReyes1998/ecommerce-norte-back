import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { Page } from '@/shared/pagination/pagination';
import { toMoney } from '@/shared/utils/money';
import {
  AdminCustomerRepository, AdminCustomerRow,
  AdminCategoryInput, AdminCategoryRepository, AdminProductFilters, AdminProductInput, AdminProductRepository,
  AdminProductRow, AdminVariantInput, DashboardRepository, DashboardStats,
} from '../../domain/admin.repository';
import { LOW_STOCK_THRESHOLD } from '../../application/use-cases/dashboard.use-case';

const include = {
  category: { select: { id: true, name: true, slug: true } },
  images: { orderBy: { sortOrder: 'asc' } },
  variants: { orderBy: [{ color: 'asc' }, { size: 'asc' }] },
} satisfies Prisma.ProductInclude;
type Row = Prisma.ProductGetPayload<{ include: typeof include }>;

function toRow(r: Row): AdminProductRow {
  return {
    id: r.id, name: r.name, slug: r.slug, description: r.description, gender: r.gender, category: r.category,
    basePrice: toMoney(r.basePrice) as number, salePrice: toMoney(r.salePrice), isFeatured: r.isFeatured,
    isActive: r.isActive, totalStock: r.variants.reduce((a, v) => a + v.stock, 0), createdAt: r.createdAt,
    images: r.images.map(({ id, url, alt, sortOrder }) => ({ id, url, alt, sortOrder })),
    variants: r.variants.map((v) => ({
      id: v.id, sku: v.sku, size: v.size, color: v.color, colorHex: v.colorHex, stock: v.stock,
      price: toMoney(v.price), salePrice: toMoney(v.salePrice), isActive: v.isActive,
    })),
  };
}

@Injectable()
export class PrismaAdminProductRepository implements AdminProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(f: AdminProductFilters, page: number, limit: number): Promise<Page<AdminProductRow>> {
    const and: Prisma.ProductWhereInput[] = [];
    if (f.search) and.push({ OR: [{ name: { contains: f.search, mode: 'insensitive' } }, { variants: { some: { sku: { contains: f.search, mode: 'insensitive' } } } }] });
    if (f.categoryId) and.push({ categoryId: f.categoryId });
    if (f.isActive !== undefined) and.push({ isActive: f.isActive });
    if (f.lowStock) and.push({ variants: { some: { isActive: true, stock: { lte: LOW_STOCK_THRESHOLD } } } });
    const where: Prisma.ProductWhereInput = { AND: and };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit, include }),
      this.prisma.product.count({ where }),
    ]);
    return { items: rows.map(toRow), total, page, limit };
  }

  async findById(id: string) {
    const row = await this.prisma.product.findUnique({ where: { id }, include });
    return row ? toRow(row) : null;
  }

  async slugExists(slug: string, exceptId?: string) {
    const found = await this.prisma.product.findFirst({ where: { slug, ...(exceptId ? { id: { not: exceptId } } : {}) }, select: { id: true } });
    return !!found;
  }

  async create(data: AdminProductInput, variants: AdminVariantInput[]) {
    const row = await this.prisma.product.create({
      data: {
        ...data,
        currentPrice: data.salePrice ?? data.basePrice,
        variants: { create: variants.map((v) => ({ ...v, id: undefined, isActive: v.isActive ?? true })) },
      },
      include,
    });
    return toRow(row);
  }

  async update(id: string, data: Partial<AdminProductInput>, variants?: AdminVariantInput[]) {
    const row = await this.prisma.$transaction(async (tx) => {
      const current = await tx.product.findUniqueOrThrow({ where: { id } });
      const basePrice = data.basePrice ?? Number(current.basePrice);
      const salePrice = data.salePrice === undefined ? (current.salePrice === null ? null : Number(current.salePrice)) : data.salePrice;

      if (variants) {
        // Las variantes que no vienen en la lista se desactivan (no se borran: pueden estar en pedidos).
        const keepIds = variants.filter((v) => v.id).map((v) => v.id as string);
        await tx.productVariant.updateMany({ where: { productId: id, id: { notIn: keepIds } }, data: { isActive: false } });
        for (const v of variants) {
          const payload = { sku: v.sku, size: v.size, color: v.color, colorHex: v.colorHex ?? null, stock: v.stock, price: v.price ?? null, salePrice: v.salePrice ?? null, isActive: v.isActive ?? true };
          if (v.id) await tx.productVariant.update({ where: { id: v.id, productId: id }, data: payload });
          else await tx.productVariant.create({ data: { ...payload, productId: id } });
        }
      }
      return tx.product.update({ where: { id }, data: { ...data, salePrice, currentPrice: salePrice ?? basePrice }, include });
    });
    return toRow(row);
  }

  async bulkUpdate(ids: string[], data: { isActive?: boolean; isFeatured?: boolean }) {
    const r = await this.prisma.product.updateMany({ where: { id: { in: ids } }, data });
    return r.count;
  }

  /** Copia producto, variantes (con stock 0 y SKU con sufijo) e imágenes; nace inactivo para revisarlo. */
  async duplicate(id: string, newName: string, newSlug: string) {
    const src = await this.prisma.product.findUniqueOrThrow({ where: { id }, include: { variants: true, images: true } });
    const row = await this.prisma.product.create({
      data: {
        name: newName, slug: newSlug, description: src.description, gender: src.gender, categoryId: src.categoryId,
        basePrice: src.basePrice, salePrice: src.salePrice, currentPrice: src.currentPrice, isFeatured: false, isActive: false,
        variants: { create: src.variants.map((v) => ({ sku: `${v.sku}-COPIA`, size: v.size, color: v.color, colorHex: v.colorHex, stock: 0, price: v.price, salePrice: v.salePrice, isActive: v.isActive })) },
        images: { create: src.images.map((i) => ({ url: i.url, alt: i.alt, sortOrder: i.sortOrder })) },
      },
      include,
    });
    return toRow(row);
  }

  async setVariantStock(variantId: string, stock: number) {
    const v = await this.prisma.productVariant.update({ where: { id: variantId }, data: { stock }, select: { id: true, stock: true } });
    return v;
  }

  async deactivate(id: string) {
    await this.prisma.product.update({ where: { id }, data: { isActive: false } });
  }

  async addImages(productId: string, images: { url: string; alt: string }[]) {
    const last = await this.prisma.productImage.aggregate({ where: { productId }, _max: { sortOrder: true } });
    const start = (last._max.sortOrder ?? -1) + 1;
    await this.prisma.productImage.createMany({ data: images.map((img, i) => ({ ...img, productId, sortOrder: start + i })) });
    return (await this.findById(productId)) as AdminProductRow;
  }

  async removeImage(productId: string, imageId: string) {
    await this.prisma.productImage.deleteMany({ where: { id: imageId, productId } });
    return (await this.findById(productId)) as AdminProductRow;
  }

  async reorderImages(productId: string, imageIds: string[]) {
    await this.prisma.$transaction(
      imageIds.map((id, i) => this.prisma.productImage.updateMany({ where: { id, productId }, data: { sortOrder: i } })),
    );
    return (await this.findById(productId)) as AdminProductRow;
  }
}

@Injectable()
export class PrismaAdminCategoryRepository implements AdminCategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const rows = await this.prisma.category.findMany({
      orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { products: true } } },
    });
    return rows.map(({ _count, createdAt: _c, updatedAt: _u, ...c }) => ({ ...c, productCount: _count.products }));
  }

  create(data: AdminCategoryInput) {
    return this.prisma.category.create({ data });
  }

  update(id: string, data: Partial<AdminCategoryInput>) {
    return this.prisma.category.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.prisma.category.delete({ where: { id } });
  }

  productCount(id: string) {
    return this.prisma.product.count({ where: { categoryId: id } });
  }
}

@Injectable()
export class PrismaDashboardRepository implements DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async stats(lowStockThreshold: number, rangeDays: number): Promise<DashboardStats> {
    const now = new Date();
    const DAY = 24 * 60 * 60 * 1000;
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const since30 = new Date(startOfDay.getTime() - (rangeDays - 1) * DAY);
    const prevStart = new Date(since30.getTime() - rangeDays * DAY);
    const paid: Prisma.OrderWhereInput = { status: { in: ['PAGADO', 'ENVIADO', 'ENTREGADO'] } };

    const [rangeAgg, prevAgg, units, created, paidInRange, cancelledInRange, newCustomers, byCategory, recentOrders] = await Promise.all([
      this.prisma.order.aggregate({ where: { ...paid, paidAt: { gte: since30 } }, _count: true, _sum: { total: true }, _avg: { total: true } }),
      this.prisma.order.aggregate({ where: { ...paid, paidAt: { gte: prevStart, lt: since30 } }, _sum: { total: true } }),
      this.prisma.orderItem.aggregate({ where: { order: { ...paid, paidAt: { gte: since30 } } }, _sum: { quantity: true } }),
      this.prisma.order.count({ where: { createdAt: { gte: since30 } } }),
      this.prisma.order.count({ where: { ...paid, createdAt: { gte: since30 } } }),
      this.prisma.order.count({ where: { status: 'CANCELADO', createdAt: { gte: since30 } } }),
      this.prisma.user.count({ where: { role: 'CUSTOMER', createdAt: { gte: since30 } } }),
      this.prisma.orderItem.findMany({
        where: { order: { ...paid, paidAt: { gte: since30 } } },
        select: { quantity: true, lineTotal: true, product: { select: { category: { select: { id: true, name: true } } } } },
      }),
      this.prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 8, select: { id: true, number: true, email: true, status: true, total: true, createdAt: true, shippingAddress: true } }),
    ]);

    const cat = new Map<string, { categoryName: string; revenue: number; units: number }>();
    byCategory.forEach((i) => {
      const c = i.product?.category ?? { id: 'otros', name: 'Sin categoría' };
      const cur = cat.get(c.id) ?? { categoryName: c.name, revenue: 0, units: 0 };
      cur.revenue += Number(i.lineTotal); cur.units += i.quantity; cat.set(c.id, cur);
    });
    const prevRevenue = toMoney(prevAgg._sum.total) ?? 0;
    const rangeRevenue = toMoney(rangeAgg._sum.total) ?? 0;

    const [today, month, pendingOrders, top, lowStock, recent] = await Promise.all([
      this.prisma.order.aggregate({ where: { ...paid, paidAt: { gte: startOfDay } }, _count: true, _sum: { total: true } }),
      this.prisma.order.aggregate({ where: { ...paid, paidAt: { gte: startOfMonth } }, _count: true, _sum: { total: true } }),
      this.prisma.order.count({ where: { status: 'PENDIENTE' } }),
      this.prisma.orderItem.groupBy({
        by: ['productId', 'productName'],
        where: { order: { ...paid, paidAt: { gte: startOfMonth } } },
        _sum: { quantity: true, lineTotal: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
      this.prisma.productVariant.findMany({
        where: { isActive: true, stock: { lte: lowStockThreshold }, product: { isActive: true } },
        orderBy: { stock: 'asc' },
        take: 20,
        include: { product: { select: { name: true } } },
      }),
      this.prisma.order.findMany({ where: { ...paid, paidAt: { gte: since30 } }, select: { paidAt: true, total: true } }),
    ]);

    const byDay = new Map<string, { revenue: number; orders: number }>();
    for (let i = 0; i < rangeDays; i++) {
      const d = new Date(since30.getTime() + i * 24 * 60 * 60 * 1000);
      byDay.set(d.toISOString().slice(0, 10), { revenue: 0, orders: 0 });
    }
    recent.forEach((o) => {
      const key = (o.paidAt as Date).toISOString().slice(0, 10);
      const day = byDay.get(key);
      if (day) { day.revenue += Number(o.total); day.orders += 1; }
    });

    return {
      rangeDays,
      today: { orders: today._count, revenue: toMoney(today._sum.total) ?? 0 },
      month: { orders: month._count, revenue: toMoney(month._sum.total) ?? 0 },
      range: { orders: rangeAgg._count, revenue: rangeRevenue, avgTicket: toMoney(rangeAgg._avg.total) ?? 0, unitsSold: units._sum.quantity ?? 0, newCustomers },
      revenueChangePct: prevRevenue > 0 ? Math.round(((rangeRevenue - prevRevenue) / prevRevenue) * 1000) / 10 : null,
      conversion: { created, paid: paidInRange, cancelled: cancelledInRange, rate: created > 0 ? Math.round((paidInRange / created) * 1000) / 10 : 0 },
      salesByCategory: [...cat].map(([categoryId, v]) => ({ categoryId, categoryName: v.categoryName, revenue: Math.round(v.revenue * 100) / 100, units: v.units })).sort((a, b) => b.revenue - a.revenue),
      recentOrders: recentOrders.map((o) => ({ id: o.id, number: o.number, email: o.email, customerName: (o.shippingAddress as { fullName?: string })?.fullName ?? '', status: o.status, total: toMoney(o.total) as number, createdAt: o.createdAt })),
      pendingOrders,
      topProducts: top.map((t) => ({ productId: t.productId, productName: t.productName, units: t._sum.quantity ?? 0, revenue: toMoney(t._sum.lineTotal) ?? 0 })),
      lowStock: lowStock.map((v) => ({ variantId: v.id, productName: v.product.name, sku: v.sku, size: v.size, color: v.color, stock: v.stock })),
      salesByDay: [...byDay].map(([date, v]) => ({ date, revenue: Math.round(v.revenue * 100) / 100, orders: v.orders })),
    };
  }
}

@Injectable()
export class PrismaAdminCustomerRepository implements AdminCustomerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(search: string | undefined, page: number, limit: number): Promise<Page<AdminCustomerRow>> {
    const where: Prisma.UserWhereInput = search
      ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }] }
      : {};
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit,
        include: { orders: { where: { status: { in: ['PAGADO', 'ENVIADO', 'ENTREGADO'] } }, select: { total: true, createdAt: true } } },
      }),
      this.prisma.user.count({ where }),
    ]);
    const items: AdminCustomerRow[] = rows.map((u) => ({
      id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role, createdAt: u.createdAt,
      ordersCount: u.orders.length,
      totalSpent: Math.round(u.orders.reduce((a, o) => a + Number(o.total), 0) * 100) / 100,
      lastOrderAt: u.orders.reduce<Date | null>((a, o) => (!a || o.createdAt > a ? o.createdAt : a), null),
    }));
    return { items, total, page, limit };
  }
}
