import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PRODUCT_REPOSITORY, ProductRepository } from '../../domain/repositories/product.repository';

@Injectable()
export class GetProductUseCase {
  constructor(@Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository) {}

  async execute(slug: string) {
    const product = await this.products.findBySlug(slug);
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }
}
