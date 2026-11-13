import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProductRepository } from '@/modules/catalog/domain/repositories/product.repository';
import { ReviewRepository, ReviewRow } from '../domain/review.repository';
import { ReviewsUseCases } from './reviews.use-cases';

const user = { id: 'u1', email: 'ana@correo.com', role: 'CUSTOMER' as const };
const row: ReviewRow = { id: 'r1', rating: 5, title: null, body: 'Muy buena', createdAt: new Date(), updatedAt: new Date(), user: { id: 'u1', name: 'Ana López' } };

describe('ReviewsUseCases', () => {
  const reviews: jest.Mocked<ReviewRepository> = {
    listByProduct: jest.fn().mockResolvedValue({ items: [row], total: 1, page: 1, limit: 10 }),
    summary: jest.fn().mockResolvedValue({ average: 5, count: 1, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 1 } }),
    findMine: jest.fn().mockResolvedValue(null),
    findById: jest.fn(),
    hasPurchased: jest.fn(),
    upsert: jest.fn().mockResolvedValue(row),
    remove: jest.fn(),
  };
  const products = { findBySlug: jest.fn() } as unknown as jest.Mocked<ProductRepository>;
  const useCase = new ReviewsUseCases(reviews, products);

  beforeEach(() => {
    products.findBySlug.mockResolvedValue({ id: 'p1' } as never);
    reviews.hasPurchased.mockReset();
  });

  it('404 si el producto no existe', async () => {
    products.findBySlug.mockResolvedValue(null);
    await expect(useCase.list('nada', 1, 10, null)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('un invitado ve las reseñas pero no puede reseñar', async () => {
    const r = await useCase.list('playera', 1, 10, null);
    expect(r.canReview).toBe(false);
    expect(r.mine).toBeNull();
    expect(reviews.hasPurchased).not.toHaveBeenCalled();
  });

  it('solo puede reseñar quien compró el producto', async () => {
    reviews.hasPurchased.mockResolvedValue(false);
    await expect(useCase.upsert('playera', user, { rating: 5, body: 'Excelente calidad' })).rejects.toBeInstanceOf(ForbiddenException);

    reviews.hasPurchased.mockResolvedValue(true);
    await useCase.upsert('playera', user, { rating: 4, title: '  Bien  ', body: 'Excelente calidad' });
    expect(reviews.upsert).toHaveBeenCalledWith({ productId: 'p1', userId: 'u1', rating: 4, title: '  Bien  ', body: 'Excelente calidad' });
  });

  it('título vacío se guarda como null', async () => {
    reviews.hasPurchased.mockResolvedValue(true);
    await useCase.upsert('playera', user, { rating: 3, title: '', body: 'Normal, cumple sin más' });
    expect(reviews.upsert).toHaveBeenLastCalledWith(expect.objectContaining({ title: null }));
  });
});
