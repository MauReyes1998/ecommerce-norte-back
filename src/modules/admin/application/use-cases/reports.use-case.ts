import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { toCsv } from '@/shared/utils/csv';
import { REPORTS_REPOSITORY, ReportsRepository } from '../../domain/reports.repository';

export const REPORT_TYPES = ['dias', 'productos', 'categorias'] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

const since = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
};

/** Reportes de ventas en CSV para el dueño: por día, por producto y por categoría. */
@Injectable()
export class ReportsUseCase {
  constructor(@Inject(REPORTS_REPOSITORY) private readonly reports: ReportsRepository) {}

  async csv(type: string, rangeDays: number): Promise<{ filename: string; content: string }> {
    if (!(REPORT_TYPES as readonly string[]).includes(type)) {
      throw new BadRequestException(`Reporte desconocido. Usa: ${REPORT_TYPES.join(', ')}`);
    }
    const from = since(rangeDays);
    const filename = `ventas-${type}-${rangeDays}dias.csv`;

    switch (type as ReportType) {
      case 'dias': {
        const rows = await this.reports.salesByDay(from);
        return {
          filename,
          content: toCsv(
            ['Fecha', 'Pedidos', 'Piezas', 'Subtotal', 'Descuentos', 'Envío', 'Total'],
            rows.map((r) => [r.date, r.orders, r.units, r.subtotal, r.discount, r.shipping, r.revenue]),
          ),
        };
      }
      case 'productos': {
        const rows = await this.reports.salesByProduct(from);
        return {
          filename,
          content: toCsv(
            ['Producto', 'Piezas', 'Pedidos', 'Ingresos'],
            rows.map((r) => [r.productName, r.units, r.orders, r.revenue]),
          ),
        };
      }
      case 'categorias': {
        const rows = await this.reports.salesByCategory(from);
        return {
          filename,
          content: toCsv(['Categoría', 'Piezas', 'Ingresos'], rows.map((r) => [r.categoryName, r.units, r.revenue])),
        };
      }
    }
  }
}
