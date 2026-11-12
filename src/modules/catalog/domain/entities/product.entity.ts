export type Gender = 'HOMBRE' | 'MUJER' | 'UNISEX';

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  sortOrder: number;
}

export interface ProductVariant {
  id: string;
  sku: string;
  size: string;
  color: string;
  colorHex: string | null;
  stock: number;
  price: number;
  salePrice: number | null;
}

export interface CategoryRef {
  id: string;
  name: string;
  slug: string;
}

/** Lo que se muestra en el catálogo (tarjeta de producto). */
export interface ProductSummary {
  id: string;
  name: string;
  slug: string;
  gender: Gender;
  basePrice: number;
  salePrice: number | null;
  currentPrice: number;
  isFeatured: boolean;
  createdAt: Date;
  category: CategoryRef;
  images: ProductImage[];
  colors: { name: string; hex: string | null }[];
  sizes: string[];
  inStock: boolean;
}

/** Lo que se muestra en el detalle del producto. */
export interface ProductDetail extends ProductSummary {
  description: string;
  variants: ProductVariant[];
}

export function isOnSale(p: Pick<ProductSummary, 'salePrice' | 'basePrice'>): boolean {
  return p.salePrice !== null && p.salePrice < p.basePrice;
}

export function discountPercent(p: Pick<ProductSummary, 'salePrice' | 'basePrice'>): number {
  if (!isOnSale(p)) return 0;
  return Math.round((1 - (p.salePrice as number) / p.basePrice) * 100);
}
