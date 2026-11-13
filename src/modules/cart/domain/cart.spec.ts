import { CartVariant } from '@/modules/catalog/domain/repositories/product.repository';
import { Coupon } from '@/modules/coupons/domain/coupon';
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

  it('recoger en tienda no cobra envío', () => {
    const q = buildQuote([{ variantId: 'v1', quantity: 1 }], [v()], { delivery: 'RECOGER' });
    expect(q).toMatchObject({ subtotal: 349, shippingCost: 0, total: 349 });
  });

  describe('cupones', () => {
    const coupon = (over: Partial<Coupon> = {}): Coupon => ({
      id: 'c1', code: 'PROMO', type: 'PERCENT', value: 10, minSubtotal: null, startsAt: null, endsAt: null,
      maxUses: null, usedCount: 0, isActive: true, createdAt: new Date(), ...over,
    });
    const items = [{ variantId: 'v1', quantity: 2 }]; // subtotal 698, envío 149

    it('porcentaje sobre el subtotal', () => {
      const q = buildQuote(items, [v()], { couponCode: 'PROMO', coupon: coupon() });
      expect(q).toMatchObject({ discount: 69.8, shippingCost: 149, total: 777.2, couponIssue: null });
      expect(q.coupon?.code).toBe('PROMO');
    });

    it('monto fijo nunca descuenta más que el subtotal', () => {
      const q = buildQuote(items, [v()], { couponCode: 'PROMO', coupon: coupon({ type: 'FIXED', value: 1000 }) });
      expect(q).toMatchObject({ discount: 698, total: 149 });
    });

    it('envío gratis deja el envío en cero', () => {
      const q = buildQuote(items, [v()], { couponCode: 'PROMO', coupon: coupon({ type: 'FREE_SHIPPING' }) });
      expect(q).toMatchObject({ discount: 0, shippingCost: 0, total: 698 });
    });

    it('reporta por qué no aplica sin descontar nada', () => {
      const cases: [Coupon | null, string][] = [
        [null, 'NO_EXISTE'],
        [coupon({ isActive: false }), 'INACTIVO'],
        [coupon({ endsAt: new Date(Date.now() - 1000) }), 'NO_VIGENTE'],
        [coupon({ maxUses: 5, usedCount: 5 }), 'AGOTADO'],
        [coupon({ minSubtotal: 1000 }), 'MINIMO'],
      ];
      for (const [c, issue] of cases) {
        const q = buildQuote(items, [v()], { couponCode: 'PROMO', coupon: c });
        expect(q).toMatchObject({ discount: 0, coupon: null, couponIssue: issue, total: 847 });
      }
    });
  });
});
