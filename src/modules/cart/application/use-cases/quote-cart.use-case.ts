import { Inject, Injectable } from '@nestjs/common';
import { PRODUCT_REPOSITORY, ProductRepository } from '@/modules/catalog/domain/repositories/product.repository';
import { COUPON_REPOSITORY, CouponRepository } from '@/modules/coupons/domain/coupon.repository';
import { normalizeCode } from '@/modules/coupons/domain/coupon';
import { buildQuote, CartItemInput, CartQuote, DeliveryMethod } from '../../domain/cart';

export interface QuoteRequest {
  delivery?: DeliveryMethod;
  couponCode?: string;
}

/** Recalcula precios, stock, envío y cupón en el servidor: nunca se confía en lo que manda el navegador. */
@Injectable()
export class QuoteCartUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
    @Inject(COUPON_REPOSITORY) private readonly coupons: CouponRepository,
  ) {}

  async execute(items: CartItemInput[], req: QuoteRequest = {}): Promise<CartQuote> {
    // Si repiten la misma variante, se suman las cantidades.
    const merged = new Map<string, number>();
    items.forEach((i) => merged.set(i.variantId, (merged.get(i.variantId) ?? 0) + i.quantity));
    const unique = [...merged].map(([variantId, quantity]) => ({ variantId, quantity }));

    const couponCode = req.couponCode ? normalizeCode(req.couponCode) : undefined;
    const [variants, coupon] = await Promise.all([
      this.products.findVariantsByIds(unique.map((i) => i.variantId)),
      couponCode ? this.coupons.findByCode(couponCode) : Promise.resolve(null),
    ]);
    return buildQuote(unique, variants, { delivery: req.delivery, couponCode, coupon });
  }
}
