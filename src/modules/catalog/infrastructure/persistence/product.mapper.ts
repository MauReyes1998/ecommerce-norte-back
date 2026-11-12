import { Prisma } from '@prisma/client';
import { toMoney } from '@/shared/utils/money';
import { ProductDetail, ProductSummary, ProductVariant } from '../../domain/entities/product.entity';

export const productSummaryInclude = {
  category: { select: { id: true, name: true, slug: true } },
  images: { orderBy: { sortOrder: 'asc' }, take: 2 },
  variants: {
    where: { isActive: true },
    select: { size: true, color: true, colorHex: true, stock: true },
  },
} satisfies Prisma.ProductInclude;

export const productDetailInclude = {
  category: { select: { id: true, name: true, slug: true } },
  images: { orderBy: { sortOrder: 'asc' } },
  variants: { where: { isActive: true } },
} satisfies Prisma.ProductInclude;

type SummaryRow = Prisma.ProductGetPayload<{ include: typeof productSummaryInclude }>;
type DetailRow = Prisma.ProductGetPayload<{ include: typeof productDetailInclude }>;

const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];

/** Ordena tallas de ropa (XS..XXL) y luego números de calzado de menor a mayor. */
export function sortSizes(sizes: string[]): string[] {
  return [...new Set(sizes)].sort((a, b) => {
    const ia = SIZE_ORDER.indexOf(a);
    const ib = SIZE_ORDER.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return Number(a) - Number(b) || a.localeCompare(b);
  });
}

function uniqueColors(variants: { color: string; colorHex: string | null }[]) {
  const map = new Map<string, string | null>();
  variants.forEach((v) => map.set(v.color, v.colorHex));
  return [...map].map(([name, hex]) => ({ name, hex }));
}

export function toProductSummary(row: SummaryRow): ProductSummary {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    gender: row.gender,
    basePrice: toMoney(row.basePrice) as number,
    salePrice: toMoney(row.salePrice),
    currentPrice: toMoney(row.currentPrice) as number,
    isFeatured: row.isFeatured,
    createdAt: row.createdAt,
    category: row.category,
    images: row.images.map(({ id, url, alt, sortOrder }) => ({ id, url, alt, sortOrder })),
    colors: uniqueColors(row.variants),
    sizes: sortSizes(row.variants.map((v) => v.size)),
    inStock: row.variants.some((v) => v.stock > 0),
  };
}

export function toProductDetail(row: DetailRow): ProductDetail {
  const variants: ProductVariant[] = row.variants.map((v) => ({
    id: v.id,
    sku: v.sku,
    size: v.size,
    color: v.color,
    colorHex: v.colorHex,
    stock: v.stock,
    // Si la variante no tiene precio propio hereda el del producto.
    price: toMoney(v.price) ?? (toMoney(row.basePrice) as number),
    salePrice: v.price !== null ? toMoney(v.salePrice) : toMoney(row.salePrice),
  }));

  return {
    ...toProductSummary({ ...row, images: row.images, variants: row.variants }),
    images: row.images.map(({ id, url, alt, sortOrder }) => ({ id, url, alt, sortOrder })),
    description: row.description,
    variants,
  };
}
