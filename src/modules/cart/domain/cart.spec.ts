import { CartVariant } from '@/modules/catalog/domain/repositories/product.repository';
import { buildQuote } from './cart';

const v = (over: Partial<CartVariant> = {}): CartVariant => ({
  variantId: 'v1', productId: 'p1', productName: 'Playera', productSlug: 'playera', sku: 'SKU', size: 'M',
  color: 'Negro', imageUrl: null, stock: 5, unitPrice: 349, isActive: true, ...over,
});

describe('buildQuote', () => {
  it('calcula subtotal, envío y total', () => {
    const q = buildQuote([{ variantId: 'v1', quantity: 2 }], [v()]);
    expect(q).toMatchObject({ subtotal: 698, shippingCost: 149, total: 847, isValid: true });
  });

  it('envío gratis a partir de $999', () => {
    expect(buildQuote([{ variantId: 'v1', quantity: 3 }], [v()]).shippingCost).toBe(0);
  });

  it('ajusta la cantidad al stock y lo marca', () => {
    const q = buildQuote([{ variantId: 'v1', quantity: 8 }], [v({ stock: 3 })]);
    expect(q.lines[0]).toMatchObject({ requested: 8, quantity: 3, issue: 'STOCK_INSUFICIENTE' });
    expect(q.isValid).toBe(false);
  });

  it('marca sin stock y no disponible', () => {
    const q = buildQuote([{ variantId: 'v1', quantity: 1 }, { variantId: 'zzz', quantity: 1 }], [v({ stock: 0 })]);
    expect(q.lines.map((l) => l.issue)).toEqual(['SIN_STOCK', 'NO_DISPONIBLE']);
    expect(q.total).toBe(0);
  });
});
