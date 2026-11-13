import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import request from 'supertest';
import { setupApp } from '@/setup-app';
import { OrdersModule } from '../../orders.module';
import { PaymentsModule } from '@/modules/payments/payments.module';
import { PRODUCT_REPOSITORY, CartVariant } from '@/modules/catalog/domain/repositories/product.repository';
import { USER_REPOSITORY } from '@/modules/auth/domain/repositories/user.repository';
import { CATEGORY_REPOSITORY } from '@/modules/catalog/domain/repositories/category.repository';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { COUPON_REPOSITORY } from '@/modules/coupons/domain/coupon.repository';
import { PAYMENT_GATEWAY, PaymentGateway } from '../../domain/services/payment-gateway';
import { NewOrder, ORDER_REPOSITORY, OrderRepository, OutOfStockError } from '../../domain/repositories/order.repository';
import { Order } from '../../domain/entities/order.entity';

const variants: CartVariant[] = [
  { variantId: '11111111-1111-4111-8111-111111111111', productId: 'p1', productName: 'Playera', productSlug: 'playera',
    sku: 'NOR-001-NEG-M', size: 'M', color: 'Negro', imageUrl: null, stock: 3, unitPrice: 349, isActive: true },
];

class InMemoryOrders implements OrderRepository {
  orders: Order[] = [];
  stock = new Map(variants.map((v) => [v.variantId, v.stock]));
  async createWithStockDecrement(o: NewOrder): Promise<Order> {
    for (const i of o.items) {
      const s = this.stock.get(i.variantId) ?? 0;
      if (s < i.quantity) throw new OutOfStockError(i.sku);
      this.stock.set(i.variantId, s - i.quantity);
    }
    const order: Order = {
      id: `aaaaaaaa-aaaa-4aaa-8aaa-${String(this.orders.length + 1).padStart(12, '0')}`,
      number: this.orders.length + 1, status: 'PENDIENTE', paymentProvider: 'mercadopago', paymentStatus: 'PENDING',
      mpPreferenceId: null, mpPaymentId: null, paidAt: null, trackingCarrier: null, trackingNumber: null, adminNote: null, history: [], createdAt: new Date(),
      ...o, items: o.items.map((i, k) => ({ id: `i${k}`, ...i })),
    };
    this.orders.push(order);
    return order;
  }
  async findById(id: string) { return this.orders.find((o) => o.id === id) ?? null; }
  async findByNumber(n: number) { return this.orders.find((o) => o.number === n) ?? null; }
  async findMany() { return { items: this.orders, total: this.orders.length, page: 1, limit: 24 }; }
  async setPreference(id: string, p: string) { (await this.findById(id))!.mpPreferenceId = p; }
  async markPaid(id: string, paymentId: string, ps: Order['paymentStatus']) {
    const o = (await this.findById(id))!;
    Object.assign(o, { mpPaymentId: paymentId, paymentStatus: ps, ...(ps === 'APPROVED' ? { status: 'PAGADO', paidAt: new Date() } : {}) });
    return o;
  }
  async updateStatus(id: string, status: Order['status']) { const o = (await this.findById(id))!; o.status = status; return o; }
  async updateAdminFields(id: string, data: Partial<Pick<Order, 'trackingCarrier' | 'trackingNumber' | 'adminNote'>>) { const o = (await this.findById(id))!; Object.assign(o, data); return o; }
  async restoreStock() {}
}

const gateway: jest.Mocked<PaymentGateway> = {
  createCheckout: jest.fn(async (o: Order) => ({ preferenceId: 'pref-1', initPoint: `https://mp.test/${o.id}` })),
  fetchPayment: jest.fn(),
};

describe('Pedidos y pagos (HTTP, sin base de datos)', () => {
  let app: INestApplication;
  const repo = new InMemoryOrders();
  const address = {
    fullName: 'Ana López', phone: '7221234567', street: 'Av. Tecnológico', extNumber: '1500',
    neighborhood: 'La Michoacana', city: 'Metepec', state: 'Estado de México', postalCode: '52140',
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = 'secreto-de-pruebas-muy-largo';
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }), OrdersModule, PaymentsModule],
    })
      .overrideProvider(PRODUCT_REPOSITORY).useValue({ findVariantsByIds: jest.fn().mockResolvedValue(variants) })
      .overrideProvider(CATEGORY_REPOSITORY).useValue({})
      .overrideProvider(USER_REPOSITORY).useValue({})
      .overrideProvider(PrismaService).useValue({})
      .overrideProvider(COUPON_REPOSITORY).useValue({ findByCode: jest.fn().mockResolvedValue(null) })
      .overrideProvider(ORDER_REPOSITORY).useValue(repo)
      .overrideProvider(PAYMENT_GATEWAY).useValue(gateway)
      .compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
  });
  afterAll(() => app.close());

  let orderId: string;

  it('crea un pedido de invitado, descuenta stock y regresa link de pago', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/orders')
      .send({ items: [{ variantId: variants[0].variantId, quantity: 2 }], shippingAddress: address, email: 'ana@correo.com' })
      .expect(201);
    orderId = res.body.data.order.id;
    expect(res.body.data.order).toMatchObject({ number: 'NOR-000001', status: 'PENDIENTE', subtotal: 698, shippingCost: 149, total: 847 });
    expect(res.body.data.checkoutUrl).toBe(`https://mp.test/${orderId}`);
    expect(repo.stock.get(variants[0].variantId)).toBe(1);
  });

  it('rechaza invitado sin correo', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/orders')
      .send({ items: [{ variantId: variants[0].variantId, quantity: 1 }], shippingAddress: address })
      .expect(400);
  });

  it('rechaza cuando ya no hay stock (409)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/orders')
      .send({ items: [{ variantId: variants[0].variantId, quantity: 2 }], shippingAddress: address, email: 'x@y.com' })
      .expect(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('el webhook consulta el pago y marca el pedido como PAGADO (idempotente)', async () => {
    gateway.fetchPayment.mockResolvedValue({ orderId, paymentId: '999', status: 'APPROVED' });
    await request(app.getHttpServer()).post('/api/v1/payments/webhook').send({ type: 'payment', data: { id: 999 } }).expect(200);
    await request(app.getHttpServer()).post('/api/v1/payments/webhook').send({ type: 'payment', data: { id: 999 } }).expect(200);
    const res = await request(app.getHttpServer()).get(`/api/v1/orders/${orderId}`).expect(200);
    expect(res.body.data).toMatchObject({ status: 'PAGADO', paymentStatus: 'APPROVED' });
  });

  it('no se puede reintentar el pago de un pedido ya pagado', async () => {
    await request(app.getHttpServer()).post(`/api/v1/orders/${orderId}/checkout`).expect(400);
  });
});
