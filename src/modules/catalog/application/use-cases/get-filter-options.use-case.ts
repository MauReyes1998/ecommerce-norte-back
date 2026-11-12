import { Inject, Injectable } from '@nestjs/common';
import { FilterOptionsQuery } from '../dto/list-products.query';
import { PRODUCT_REPOSITORY, ProductRepository } from '../../domain/repositories/product.repository';

/** Tallas, colores y rango de precio disponibles para armar los filtros del catálogo. */
@Injectable()
export class GetFilterOptionsUseCase {
  constructor(@Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository) {}

  execute(query: FilterOptionsQuery) {
    return this.products.getFilterOptions({ categorySlug: query.category, gender: query.gender });
  }
}
