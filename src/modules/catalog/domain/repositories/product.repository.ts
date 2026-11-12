import { Page } from '@/shared/pagination/pagination';
import { Gender, ProductDetail, ProductSummary } from '../entities/product.entity';

export type ProductSort = 'newest' | 'price_asc' | 'price_desc';

export interface ProductFilters {
  categorySlug?: string;
  gender?: Gender;
  sizes?: string[];
  colors?: string[];
  minPrice?: number;
  maxPrice?: number;
  onSale?: boolean;
  featured?: boolean;
  search?: string;
}

export interface FilterOptions {
  sizes: string[];
  colors: { name: string; hex: string | null }[];
  priceRange: { min: number; max: number };
}

/** Lo que el carrito y los pedidos necesitan saber de una variante. */
export interface CartVariant {
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  sku: string;
  size: string;
  color: string;
  imageUrl: string | null;
  stock: number;
  unitPrice: number;
  isActive: boolean;
}

export interface ProductRepository {
  findVariantsByIds(variantIds: string[]): Promise<CartVariant[]>;
  findMany(filters: ProductFilters, sort: ProductSort, page: number, limit: number): Promise<Page<ProductSummary>>;
  findBySlug(slug: string): Promise<ProductDetail | null>;
  findRelated(productId: string, categoryId: string, limit: number): Promise<ProductSummary[]>;
  getFilterOptions(filters: Pick<ProductFilters, 'categorySlug' | 'gender'>): Promise<FilterOptions>;
}

/** Token de inyección: los casos de uso dependen de la interfaz, no de Prisma. */
export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');
