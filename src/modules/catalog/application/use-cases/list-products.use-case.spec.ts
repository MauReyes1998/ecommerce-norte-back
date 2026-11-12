import { BadRequestException } from '@nestjs/common';
import { ListProductsUseCase } from './list-products.use-case';
import { ProductRepository } from '../../domain/repositories/product.repository';
import { ListProductsQuery } from '../dto/list-products.query';

describe('ListProductsUseCase', () => {
  const repo: jest.Mocked<ProductRepository> = {
    findVariantsByIds: jest.fn(),
    findMany: jest.fn(),
    findBySlug: jest.fn(),
    findRelated: jest.fn(),
    getFilterOptions: jest.fn(),
  };
  const useCase = new ListProductsUseCase(repo);

  beforeEach(() => jest.clearAllMocks());

  it('pasa filtros, orden y paginación al repositorio', async () => {
    repo.findMany.mockResolvedValue({ items: [], total: 0, page: 2, limit: 12 });
    const query = Object.assign(new ListProductsQuery(), {
      page: 2,
      limit: 12,
      category: 'hombre',
      sizes: ['M'],
      sort: 'price_asc',
    });

    await useCase.execute(query);

    expect(repo.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ categorySlug: 'hombre', sizes: ['M'] }),
      'price_asc',
      2,
      12,
    );
  });

  it('rechaza un rango de precios invertido', async () => {
    const query = Object.assign(new ListProductsQuery(), { minPrice: 900, maxPrice: 100 });
    expect(() => useCase.execute(query)).toThrow(BadRequestException);
    expect(repo.findMany).not.toHaveBeenCalled();
  });
});
