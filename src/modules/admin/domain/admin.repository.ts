import { Page } from '@/shared/pagination/pagination';

export interface AdminVariantInput {
  id?: string;
  sku: string;
  size: string;
  color: string;
  colorHex?: string | null;
  stock: number;
  price?: number | null;
  salePrice?: number | null;
  isActive?: boolean;
}

export interface AdminProductInput {
  name: string;
  slug: string;
  description: string;
  gender: 'HOMBRE' | 'MUJER' | 'UNISEX';
  categoryId: string;
  basePrice: number;
  salePrice: number | null;
  isFeatured: boolean;
  isActive: boolean;
}

export interface AdminProductRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  gender: 'HOMBRE' | 'MUJER' | 'UNISEX';
  category: { id: string; name: string; slug: string };
  basePrice: number;
  salePrice: number | null;
  isFeatured: boolean;
  isActive: boolean;
  totalStock: number;
  images: { id: string; url: string; alt: string; sortOrder: number }[];
  variants: { id: string; sku: string; size: string; color: string; colorHex: string | null; stock: number; price: number | null; salePrice: number | null; isActive: boolean }[];
  createdAt: Date;
}

export interface AdminProductFilters {
  search?: string;
  categoryId?: string;
  isActive?: boolean;
  lowStock?: boolean;
}

export interface AdminCategoryInput {
  name: string;
  slug: string;
  parentId: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface DashboardStats {
  /** Días que cubre el rango pedido (7, 30 o 90). */
  rangeDays: number;
  today: { orders: number; revenue: number };
  month: { orders: number; revenue: number };
  range: { orders: number; revenue: number; avgTicket: number; unitsSold: number; newCustomers: number };
  /** Comparación con el rango anterior de la misma duración, en porcentaje (null si no hay base). */
  revenueChangePct: number | null;
  /** Pedidos creados en el rango vs. los que llegaron a pagarse. */
  conversion: { created: number; paid: number; cancelled: number; rate: number };
  pendingOrders: number;
  salesByCategory: { categoryId: string; categoryName: string; revenue: number; units: number }[];
  recentOrders: { id: string; number: number; email: string; customerName: string; status: string; total: number; createdAt: Date }[];
  topProducts: { productId: string | null; productName: string; units: number; revenue: number }[];
  lowStock: { variantId: string; productName: string; sku: string; size: string; color: string; stock: number }[];
  salesByDay: { date: string; revenue: number; orders: number }[];
}

export interface AdminProductRepository {
  findMany(filters: AdminProductFilters, page: number, limit: number): Promise<Page<AdminProductRow>>;
  findById(id: string): Promise<AdminProductRow | null>;
  slugExists(slug: string, exceptId?: string): Promise<boolean>;
  create(data: AdminProductInput, variants: AdminVariantInput[]): Promise<AdminProductRow>;
  update(id: string, data: Partial<AdminProductInput>, variants?: AdminVariantInput[]): Promise<AdminProductRow>;
  deactivate(id: string): Promise<void>;
  addImages(productId: string, images: { url: string; alt: string }[]): Promise<AdminProductRow>;
  removeImage(productId: string, imageId: string): Promise<AdminProductRow>;
  reorderImages(productId: string, imageIds: string[]): Promise<AdminProductRow>;
  bulkUpdate(ids: string[], data: { isActive?: boolean; isFeatured?: boolean }): Promise<number>;
  duplicate(id: string, newName: string, newSlug: string): Promise<AdminProductRow>;
  setVariantStock(variantId: string, stock: number): Promise<{ id: string; stock: number }>;
}

export interface AdminCategoryRepository {
  findAll(): Promise<(AdminCategoryInput & { id: string; productCount: number })[]>;
  create(data: AdminCategoryInput): Promise<AdminCategoryInput & { id: string }>;
  update(id: string, data: Partial<AdminCategoryInput>): Promise<AdminCategoryInput & { id: string }>;
  remove(id: string): Promise<void>;
  productCount(id: string): Promise<number>;
}

export interface DashboardRepository {
  stats(lowStockThreshold: number, rangeDays: number): Promise<DashboardStats>;
}

export interface AdminCustomerRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: 'CUSTOMER' | 'ADMIN';
  createdAt: Date;
  ordersCount: number;
  totalSpent: number;
  lastOrderAt: Date | null;
}

export interface AdminCustomerRepository {
  findMany(search: string | undefined, page: number, limit: number): Promise<Page<AdminCustomerRow>>;
}

export const ADMIN_CUSTOMER_REPOSITORY = Symbol('ADMIN_CUSTOMER_REPOSITORY');

export const ADMIN_PRODUCT_REPOSITORY = Symbol('ADMIN_PRODUCT_REPOSITORY');
export const ADMIN_CATEGORY_REPOSITORY = Symbol('ADMIN_CATEGORY_REPOSITORY');
export const DASHBOARD_REPOSITORY = Symbol('DASHBOARD_REPOSITORY');
