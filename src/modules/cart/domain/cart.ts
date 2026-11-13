/** Reglas de negocio del carrito. Puras: sin Nest ni Prisma, fáciles de probar. */
import { CartVariant } from '@/modules/catalog/domain/repositories/product.repository';
import { applyCoupon, checkCoupon, Coupon, CouponIssue, CouponType } from '@/modules/coupons/domain/coupon';

export const SHIPPING_COST = 149;
export const FREE_SHIPPING_FROM = 999;
export const MAX_QTY_PER_LINE = 10;

export const DELIVERY_METHODS = ['ENVIO', 'RECOGER'] as const;
export type DeliveryMethod = (typeof DELIVERY_METHODS)[number];

export interface CartItemInput {
  variantId: string;
  quantity: number;
}

export type LineIssue = 'OK' | 'SIN_STOCK' | 'STOCK_INSUFICIENTE' | 'NO_DISPONIBLE';

export interface CartQuoteLine {
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  imageUrl: string | null;
  sku: string;
  size: string;
  color: string;
  unitPrice: number;
  /** Cantidad pedida por el cliente. */
  requested: number;
  /** Cantidad que sí se puede comprar (ajustada al stock). */
  quantity: number;
  available: number;
  lineTotal: number;
  issue: LineIssue;
}

export interface QuoteOptions {
  delivery?: DeliveryMethod;
  /** Código que pidió el cliente (ya normalizado). */
  couponCode?: string;
  /** Cupón encontrado en la base para ese código, o null si no existe. */
  coupon?: Coupon | null;
}

export interface CartQuote {
  lines: CartQuoteLine[];
  subtotal: number;
  /** Descuento del cupón sobre el subtotal (ya restado en total). */
  discount: number;
  coupon: { id: string; code: string; type: CouponType; value: number } | null;
  /** Por qué no se aplicó el cupón pedido; null si se aplicó o no se pidió. */
  couponIssue: CouponIssue | null;
  shippingCost: number;
  total: number;
  /** false si alguna línea tuvo que ajustarse o ya no está disponible. */
  isValid: boolean;
}

export const shippingFor = (subtotal: number, delivery: DeliveryMethod = 'ENVIO') =>
  (delivery === 'RECOGER' || subtotal === 0 || subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_COST);
const round = (n: number) => Math.round(n * 100) / 100;

/** Une lo que pidió el cliente con el estado real del catálogo y recalcula todo. */
export function buildQuote(items: CartItemInput[], variants: CartVariant[], opts: QuoteOptions = {}): CartQuote {
  const delivery = opts.delivery ?? 'ENVIO';
  const byId = new Map(variants.map((v) => [v.variantId, v]));

  const lines: CartQuoteLine[] = items.map(({ variantId, quantity: requested }) => {
    const v = byId.get(variantId);
    const capped = Math.min(requested, MAX_QTY_PER_LINE);
    if (!v || !v.isActive) {
      return {
        variantId, productId: v?.productId ?? '', productName: v?.productName ?? 'Producto no disponible',
        productSlug: v?.productSlug ?? '', imageUrl: v?.imageUrl ?? null, sku: v?.sku ?? '', size: v?.size ?? '',
        color: v?.color ?? '', unitPrice: v?.unitPrice ?? 0, requested, quantity: 0, available: 0, lineTotal: 0,
        issue: 'NO_DISPONIBLE',
      };
    }
    const quantity = Math.min(capped, v.stock);
    const issue: LineIssue = v.stock === 0 ? 'SIN_STOCK' : quantity < requested ? 'STOCK_INSUFICIENTE' : 'OK';
    return {
      variantId, productId: v.productId, productName: v.productName, productSlug: v.productSlug, imageUrl: v.imageUrl,
      sku: v.sku, size: v.size, color: v.color, unitPrice: v.unitPrice, requested, quantity, available: v.stock,
      lineTotal: round(v.unitPrice * quantity), issue,
    };
  });

  const subtotal = round(lines.reduce((s, l) => s + l.lineTotal, 0));
  let shippingCost = shippingFor(subtotal, delivery);

  // Cupón: solo se evalúa si el cliente mandó un código y hay algo que descontar.
  let discount = 0;
  let coupon: CartQuote['coupon'] = null;
  let couponIssue: CouponIssue | null = null;
  if (opts.couponCode && subtotal > 0) {
    couponIssue = checkCoupon(opts.coupon ?? null, subtotal);
    if (!couponIssue && opts.coupon) {
      const applied = applyCoupon(opts.coupon, subtotal, shippingCost);
      discount = applied.discount;
      shippingCost = applied.shippingCost;
      coupon = { id: opts.coupon.id, code: opts.coupon.code, type: opts.coupon.type, value: opts.coupon.value };
    }
  }

  return {
    lines, subtotal, discount, coupon, couponIssue, shippingCost,
    total: round(subtotal - discount + shippingCost),
    isValid: lines.every((l) => l.issue === 'OK'),
  };
}
