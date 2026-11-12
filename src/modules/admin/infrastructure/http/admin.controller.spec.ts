import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { setupApp } from '@/setup-app';
import { AdminModule } from '../../admin.module';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { USER_REPOSITORY } from '@/modules/auth/domain/repositories/user.repository';
import { ORDER_REPOSITORY } from '@/modules/orders/domain/repositories/order.repository';
import { PAYMENT_GATEWAY } from '@/modules/orders/domain/services/payment-gateway';
import { PRODUCT_REPOSITORY } from '@/modules/catalog/domain/repositories/product.repository';
import { CATEGORY_REPOSITORY } from '@/modules/catalog/domain/repositories/category.repository';
import { ADMIN_CATEGORY_REPOSITORY, ADMIN_CUSTOMER_REPOSITORY, ADMIN_PRODUCT_REPOSITORY, DASHBOARD_REPOSITORY } from '../../domain/admin.repository';

describe('Admin (permisos y validaciones)', () => {
  let app: INestApplication;
  let adminToken: string;
  let customerToken: string;
  const products = { findMany: jest.fn(), findById: jest.fn(), slugExists: jest.fn().mockResolvedValue(false), create: jest.fn(), update: jest.fn(), deactivate: jest.fn(), addImages: jest.fn(), removeImage: jest.fn(), reorderImages: jest.fn() };
  const orders = { findMany: jest.fn().mockResolvedValue({ items: [], total: 0, page: 1, limit: 24 }), findById: jest.fn(), updateStatus: jest.fn(), restoreStock: jest.fn() };

  beforeAll(async () => {
    process.env.JWT_SECRET = 'secreto-de-pruebas-muy-largo';
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }), AdminModule],
    })
      .overrideProvider(PrismaService).useValue({})
      .overrideProvider(USER_REPOSITORY).useValue({})
      .overrideProvider(ORDER_REPOSITORY).useValue(orders)
      .overrideProvider(PAYMENT_GATEWAY).useValue({})
      .overrideProvider(PRODUCT_REPOSITORY).useValue({})
      .overrideProvider(CATEGORY_REPOSITORY).useValue({})
      .overrideProvider(ADMIN_PRODUCT_REPOSITORY).useValue(products)
      .overrideProvider(ADMIN_CATEGORY_REPOSITORY).useValue({})
      .overrideProvider(DASHBOARD_REPOSITORY).useValue({ stats: jest.fn().mockResolvedValue({ pendingOrders: 2 }) })
      .overrideProvider(ADMIN_CUSTOMER_REPOSITORY).useValue({ findMany: jest.fn().mockResolvedValue({ items: [], total: 0, page: 1, limit: 20 }) })
      .compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
    const jwt = app.get(JwtService);
    adminToken = jwt.sign({ sub: 'a1', email: 'admin@norte.mx', role: 'ADMIN' });
    customerToken = jwt.sign({ sub: 'c1', email: 'ana@correo.com', role: 'CUSTOMER' });
  });
  afterAll(() => app.close());

  it('sin token: 401; cliente: 403; admin: 200', async () => {
    await request(app.getHttpServer()).get('/api/v1/admin/dashboard').expect(401);
    await request(app.getHttpServer()).get('/api/v1/admin/dashboard').set('Authorization', `Bearer ${customerToken}`).expect(403);
    const res = await request(app.getHttpServer()).get('/api/v1/admin/dashboard').set('Authorization', `Bearer ${adminToken}`).expect(200);
    expect(res.body.data.pendingOrders).toBe(2);
  });

  it('rechaza oferta mayor o igual al precio base', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/admin/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Playera X', description: 'Descripción suficiente', gender: 'HOMBRE', categoryId: '11111111-1111-4111-8111-111111111111', basePrice: 300, salePrice: 300, variants: [{ sku: 'SKU-A', size: 'M', color: 'Negro', stock: 1 }] })
      .expect(400);
    expect(res.body.error.message).toMatch(/oferta/);
    expect(products.create).not.toHaveBeenCalled();
  });

  it('rechaza variantes repetidas', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/admin/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Playera X', description: 'Descripción suficiente', gender: 'HOMBRE', categoryId: '11111111-1111-4111-8111-111111111111', basePrice: 300, variants: [{ sku: 'SKU-A', size: 'M', color: 'Negro', stock: 1 }, { sku: 'SKU-B', size: 'M', color: 'negro', stock: 1 }] })
      .expect(400);
    expect(res.body.error.message).toMatch(/repetida/);
  });

  it('no permite una transición de estatus inválida', async () => {
    orders.findById.mockResolvedValue({ id: 'o1', status: 'ENTREGADO' });
    const res = await request(app.getHttpServer())
      .patch('/api/v1/admin/orders/11111111-1111-4111-8111-111111111111/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'CANCELADO' })
      .expect(400);
    expect(res.body.error.message).toMatch(/No se puede pasar/);
  });
});
