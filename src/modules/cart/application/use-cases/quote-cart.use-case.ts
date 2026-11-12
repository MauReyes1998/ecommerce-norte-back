import { Inject, Injectable } from '@nestjs/common';
import { PRODUCT_REPOSITORY, ProductRepository } from '@/modules/catalog/domain/repositories/product.repository';
import { buildQuote, CartItemInput, CartQuote } from '../../domain/cart';

/** Recalcula precios y stock en el servidor: nunca se confía en lo que manda el navegador. */
@Injectable()
export class QuoteCartUseCase {
  constructor(@Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository) {}

  async execute(items: CartItemInput[]): Promise<CartQuote> {
    // Si repiten la misma variante, se suman las cantidades.
    const merged = new Map<string, number>();
    items.forEach((i) => merged.set(i.variantId, (merged.get(i.variantId) ?? 0) + i.quantity));
    const unique = [...merged].map(([variantId, quantity]) => ({ variantId, quantity }));

    const variants = await this.products.findVariantsByIds(unique.map((i) => i.variantId));
    return buildQuote(unique, variants);
  }
}
