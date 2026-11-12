/** Reglas de negocio del carrito. Puras: sin Nest ni Prisma, fáciles de probar. */
import { CartVariant } from '@/modules/catalog/domain/repositories/product.repository';

export const SHIPPING_COST = 149;
export const FREE_SHIPPING_FROM = 999;
export const MAX_QTY_PER_LINE = 10;

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

export interface CartQuote {
  lines: CartQuoteLine[];
  subtotal: number;
  shippingCost: number;
  total: number;
  /** false si alguna línea tuvo que ajustarse o ya no está disponible. */
  isValid: boolean;
}

export const shippingFor = (subtotal: number) => (subtotal === 0 || subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_COST);
const round = (n: number) => Math.round(n * 100) / 100;

/** Une lo que pidió el cliente con el estado real del catálogo y recalcula todo. */
export function buildQuote(items: CartItemInput[], variants: CartVariant[]): CartQuote {
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
  const shippingCost = shippingFor(subtotal);
  return { lines, subtotal, shippingCost, total: round(subtotal + shippingCost), isValid: lines.every((l) => l.issue === 'OK') };
}
