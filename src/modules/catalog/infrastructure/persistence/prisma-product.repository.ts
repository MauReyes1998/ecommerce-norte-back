import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { Page } from '@/shared/pagination/pagination';
import { toMoney } from '@/shared/utils/money';
import { ProductDetail, ProductSummary } from '../../domain/entities/product.entity';
import {
  CartVariant,
  FilterOptions,
  ProductFilters,
  ProductRepository,
  ProductSort,
} from '../../domain/repositories/product.repository';
import {
  productDetailInclude,
  productSummaryInclude,
  sortSizes,
  toProductDetail,
  toProductSummary,
} from './product.mapper';

@Injectable()
export class PrismaProductRepository implements ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findVariantsByIds(variantIds: string[]): Promise<CartVariant[]> {
    if (variantIds.length === 0) return [];
    const rows = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: {
        product: {
          select: {
            id: true, name: true, slug: true, isActive: true, basePrice: true, salePrice: true,
            images: { orderBy: { sortOrder: 'asc' }, take: 1, select: { url: true } },
          },
        },
      },
    });
    return rows.map((v) => ({
      variantId: v.id,
      productId: v.product.id,
      productName: v.product.name,
      productSlug: v.product.slug,
      sku: v.sku,
      size: v.size,
      color: v.color,
      imageUrl: v.product.images[0]?.url ?? null,
      stock: v.stock,
      // Precio vigente: oferta de la variante, precio de la variante, o el del producto.
      unitPrice:
        v.price !== null
          ? (toMoney(v.salePrice) ?? (toMoney(v.price) as number))
          : (toMoney(v.product.salePrice) ?? (toMoney(v.product.basePrice) as number)),
      isActive: v.isActive && v.product.isActive,
    }));
  }

  async findMany(filters: ProductFilters, sort: ProductSort, page: number, limit: number): Promise<Page<ProductSummary>> {
    const where = await this.buildWhere(filters);
    const orderBy = this.buildOrderBy(sort);

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: productSummaryInclude,
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items: rows.map(toProductSummary), total, page, limit };
  }

  async findBySlug(slug: string): Promise<ProductDetail | null> {
    const row = await this.prisma.product.findFirst({
      where: { slug, isActive: true },
      include: productDetailInclude,
    });
    return row ? toProductDetail(row) : null;
  }

  findSitemapEntries(): Promise<{ slug: string; updatedAt: Date }[]> {
    return this.prisma.product.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findRelated(productId: string, categoryId: string, limit: number): Promise<ProductSummary[]> {
    const rows = await this.prisma.product.findMany({
      where: { isActive: true, categoryId, id: { not: productId } },
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
      take: limit,
      include: productSummaryInclude,
    });
    return rows.map(toProductSummary);
  }

  async getFilterOptions(filters: Pick<ProductFilters, 'categorySlug' | 'gender'>): Promise<FilterOptions> {
    const productWhere = await this.buildWhere(filters);

    const [variants, price] = await Promise.all([
      this.prisma.productVariant.findMany({
        where: { isActive: true, product: productWhere },
        select: { size: true, color: true, colorHex: true },
        distinct: ['size', 'color'],
      }),
      this.prisma.product.aggregate({
        where: productWhere,
        _min: { currentPrice: true },
        _max: { currentPrice: true },
      }),
    ]);

    const colors = new Map<string, string | null>();
    variants.forEach((v) => colors.set(v.color, v.colorHex));

    return {
      sizes: sortSizes(variants.map((v) => v.size)),
      colors: [...colors].map(([name, hex]) => ({ name, hex })).sort((a, b) => a.name.localeCompare(b.name)),
      priceRange: { min: toMoney(price._min.currentPrice) ?? 0, max: toMoney(price._max.currentPrice) ?? 0 },
    };
  }

  private async buildWhere(filters: ProductFilters): Promise<Prisma.ProductWhereInput> {
    const and: Prisma.ProductWhereInput[] = [{ isActive: true }];

    if (filters.categorySlug) {
      // Una categoría raíz (p. ej. "hombre") incluye a sus subcategorías.
      const category = await this.prisma.category.findUnique({
        where: { slug: filters.categorySlug },
        select: { id: true, children: { select: { id: true } } },
      });
      const ids = category ? [category.id, ...category.children.map((c) => c.id)] : [];
      and.push({ categoryId: { in: ids } });
    }
    if (filters.gender) and.push({ gender: { in: [filters.gender, 'UNISEX'] } });
    if (filters.onSale) and.push({ salePrice: { not: null } });
    if (filters.featured) and.push({ isFeatured: true });
    if (filters.search) and.push({ name: { contains: filters.search, mode: 'insensitive' } });
    if (filters.minPrice !== undefined) and.push({ currentPrice: { gte: filters.minPrice } });
    if (filters.maxPrice !== undefined) and.push({ currentPrice: { lte: filters.maxPrice } });

    if (filters.sizes?.length || filters.colors?.length) {
      and.push({
        variants: {
          some: {
            isActive: true,
            stock: { gt: 0 },
            ...(filters.sizes?.length ? { size: { in: filters.sizes } } : {}),
            ...(filters.colors?.length ? { color: { in: filters.colors, mode: 'insensitive' } } : {}),
          },
        },
      });
    }

    return { AND: and };
  }

  private buildOrderBy(sort: ProductSort): Prisma.ProductOrderByWithRelationInput[] {
    switch (sort) {
      case 'price_asc':
        return [{ currentPrice: 'asc' }, { id: 'asc' }];
      case 'price_desc':
        return [{ currentPrice: 'desc' }, { id: 'asc' }];
      default:
        return [{ createdAt: 'desc' }, { id: 'asc' }];
    }
  }
}
