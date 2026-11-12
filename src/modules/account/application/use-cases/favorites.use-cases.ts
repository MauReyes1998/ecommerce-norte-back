import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PRODUCT_REPOSITORY, ProductRepository } from '@/modules/catalog/domain/repositories/product.repository';
import { FAVORITE_REPOSITORY, FavoriteRepository } from '../../domain/account.repository';

@Injectable()
export class FavoritesUseCases {
  constructor(
    @Inject(FAVORITE_REPOSITORY) private readonly favorites: FavoriteRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
  ) {}

  list(userId: string) {
    return this.favorites.findByUser(userId);
  }

  ids(userId: string) {
    return this.favorites.idsByUser(userId);
  }

  async add(userId: string, productSlug: string) {
    const product = await this.products.findBySlug(productSlug);
    if (!product) throw new NotFoundException('Producto no encontrado');
    await this.favorites.add(userId, product.id);
    return { productId: product.id };
  }

  async remove(userId: string, productId: string) {
    await this.favorites.remove(userId, productId);
  }
}
