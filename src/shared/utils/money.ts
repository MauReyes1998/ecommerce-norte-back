import { Prisma } from '@prisma/client';

type DecimalLike = Prisma.Decimal | number | string | null | undefined;

/** Prisma regresa Decimal; la API expone números con 2 decimales. */
export function toMoney(value: DecimalLike): number | null {
  if (value === null || value === undefined) return null;
  return Math.round(Number(value) * 100) / 100;
}

/** Precio vigente: el de oferta si existe, si no el base. */
export function effectivePrice(base: DecimalLike, sale?: DecimalLike): number {
  return toMoney(sale) ?? toMoney(base) ?? 0;
}
