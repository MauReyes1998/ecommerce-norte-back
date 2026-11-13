import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupApp } from '@/setup-app';
import { CatalogModule } from '../../catalog.module';
import { PRODUCT_REPOSITORY, ProductRepository } from '../../domain/repositories/product.repository';
import { CATEGORY_REPOSITORY } from '../../domain/repositories/category.repository';
import { ProductSummary } from '../../domain/entities/product.entity';

const product: ProductSummary = {
  id: 'p1',
  name: 'Playera Oversize Básica',
  slug: 'playera-oversize-basica',
  gender: 'HOMBRE',
  basePrice: 349,
  salePrice: 299,
  currentPrice: 299,
  isFeatured: true,
  createdAt: new Date(),
  category: { id: 'c1', name: 'Playeras', slug: 'hombre-playeras' },
  images: [],
  colors: [{ name: 'Negro', hex: '#111111' }],
  sizes: ['S', 'M'],
  inStock: true,
};

describe('GET /api/v1/products (HTTP, repositorio simulado)', () => {
  let app: INestApplication;
  const repo: jest.Mocked<ProductRepository> = {
    findVariantsByIds: jest.fn(),
    findMany: jest.fn().mockResolvedValue({ items: [product], total: 1, page: 1, limit: 24 }),
    findBySlug: jest.fn().mockResolvedValue(null),
    findSitemapEntries: jest.fn().mockResolvedValue([]),
    findRelated: jest.fn(),
    getFilterOptions: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [CatalogModule] })
      .overrideProvider(PRODUCT_REPOSITORY)
      .useValue(repo)
      .overrideProvider(CATEGORY_REPOSITORY)
      .useValue({ findTree: jest.fn().mockResolvedValue([]), findBySlug: jest.fn() })
      .compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
  });

  afterAll(() => app.close());

  it('regresa data + meta con descuento calculado', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/products?sizes=S,M&sort=price_asc').expect(200);
    expect(res.body.meta).toMatchObject({ total: 1, page: 1, totalPages: 1, hasNext: false });
    expect(res.body.data[0]).toMatchObject({ onSale: true, discountPercent: 14, currentPrice: 299 });
    expect(repo.findMany).toHaveBeenCalledWith(expect.objectContaining({ sizes: ['S', 'M'] }), 'price_asc', 1, 24);
  });

  it('rechaza parámetros desconocidos con error JSON consistente', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/products?foo=bar').expect(400);
    expect(res.body.error).toMatchObject({ statusCode: 400, code: 'VALIDATION_ERROR' });
  });

  it('404 con forma estándar cuando el producto no existe', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/products/no-existe').expect(404);
    expect(res.body.error.message).toBe('Producto no encontrado');
  });
});
