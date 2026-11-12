import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ListProductsQuery } from '../dto/list-products.query';
import { PRODUCT_REPOSITORY, ProductRepository } from '../../domain/repositories/product.repository';

@Injectable()
export class ListProductsUseCase {
  constructor(@Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository) {}

  execute(query: ListProductsQuery) {
    if (query.minPrice !== undefined && query.maxPrice !== undefined && query.minPrice > query.maxPrice) {
      throw new BadRequestException('El precio mínimo no puede ser mayor al máximo');
    }
    const { page, limit, sort, category, ...rest } = query;
    return this.products.findMany({ ...rest, categorySlug: category }, sort, page, limit);
  }
}
