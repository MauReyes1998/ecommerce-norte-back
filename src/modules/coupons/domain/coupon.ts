/** Reglas de negocio de cupones. Puras: sin Nest ni Prisma, fáciles de probar. */

export const COUPON_TYPES = ['PERCENT', 'FIXED', 'FREE_SHIPPING'] as const;
export type CouponType = (typeof COUPON_TYPES)[number];

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  /** % para PERCENT, pesos para FIXED, 0 para FREE_SHIPPING. */
  value: number;
  minSubtotal: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  createdAt: Date;
}

/** Los códigos se guardan y comparan en mayúsculas sin espacios. */
export const normalizeCode = (code: string) => code.trim().toUpperCase();

export type CouponIssue = 'NO_EXISTE' | 'INACTIVO' | 'NO_VIGENTE' | 'AGOTADO' | 'MINIMO';

export const COUPON_ISSUE_MESSAGE: Record<CouponIssue, string> = {
  NO_EXISTE: 'Ese cupón no existe.',
  INACTIVO: 'Ese cupón ya no está activo.',
  NO_VIGENTE: 'Ese cupón no está vigente.',
  AGOTADO: 'Ese cupón ya alcanzó su límite de usos.',
  MINIMO: 'Tu compra no alcanza el mínimo para usar ese cupón.',
};

/** null = se puede usar; si no, la razón por la que no. */
export function checkCoupon(coupon: Coupon | null, subtotal: number, now = new Date()): CouponIssue | null {
  if (!coupon) return 'NO_EXISTE';
  if (!coupon.isActive) return 'INACTIVO';
  if ((coupon.startsAt && coupon.startsAt > now) || (coupon.endsAt && coupon.endsAt < now)) return 'NO_VIGENTE';
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) return 'AGOTADO';
  if (coupon.minSubtotal !== null && subtotal < coupon.minSubtotal) return 'MINIMO';
  return null;
}

const round = (n: number) => Math.round(n * 100) / 100;

/** Descuento sobre el subtotal y costo de envío resultante. Nunca descuenta más que el subtotal. */
export function applyCoupon(coupon: Coupon, subtotal: number, shippingCost: number): { discount: number; shippingCost: number } {
  switch (coupon.type) {
    case 'PERCENT':
      return { discount: round((subtotal * Math.min(coupon.value, 100)) / 100), shippingCost };
    case 'FIXED':
      return { discount: round(Math.min(coupon.value, subtotal)), shippingCost };
    case 'FREE_SHIPPING':
      return { discount: 0, shippingCost: 0 };
  }
}
