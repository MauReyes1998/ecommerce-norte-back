export interface DailySales { date: string; orders: number; units: number; subtotal: number; discount: number; shipping: number; revenue: number }
export interface ProductSales { productId: string | null; productName: string; units: number; revenue: number; orders: number }
export interface CategorySales { categoryId: string | null; categoryName: string; units: number; revenue: number }

/** Consultas de ventas para reportes descargables. Solo cuentan pedidos pagados (PAGADO, ENVIADO, ENTREGADO). */
export interface ReportsRepository {
  salesByDay(since: Date): Promise<DailySales[]>;
  salesByProduct(since: Date): Promise<ProductSales[]>;
  salesByCategory(since: Date): Promise<CategorySales[]>;
}

export const REPORTS_REPOSITORY = Symbol('REPORTS_REPOSITORY');
