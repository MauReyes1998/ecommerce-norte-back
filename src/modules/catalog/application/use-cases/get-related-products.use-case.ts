import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PRODUCT_REPOSITORY, ProductRepository } from '../../domain/repositories/product.repository';

@Injectable()
export class GetRelatedProductsUseCase {
  constructor(@Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository) {}

  async execute(slug: string, limit = 4) {
    const product = await this.products.findBySlug(slug);
    if (!product) throw new NotFoundException('Producto no encontrado');
    return this.products.findRelated(product.id, product.category.id, limit);
  }
}
