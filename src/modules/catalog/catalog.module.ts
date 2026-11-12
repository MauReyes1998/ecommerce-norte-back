import { Module } from '@nestjs/common';
import { PRODUCT_REPOSITORY } from './domain/repositories/product.repository';
import { CATEGORY_REPOSITORY } from './domain/repositories/category.repository';
import { PrismaProductRepository } from './infrastructure/persistence/prisma-product.repository';
import { PrismaCategoryRepository } from './infrastructure/persistence/prisma-category.repository';
import { ListProductsUseCase } from './application/use-cases/list-products.use-case';
import { GetProductUseCase } from './application/use-cases/get-product.use-case';
import { GetRelatedProductsUseCase } from './application/use-cases/get-related-products.use-case';
import { GetFilterOptionsUseCase } from './application/use-cases/get-filter-options.use-case';
import { ListCategoriesUseCase } from './application/use-cases/list-categories.use-case';
import { ProductsController } from './infrastructure/http/products.controller';
import { CategoriesController } from './infrastructure/http/categories.controller';

@Module({
  controllers: [ProductsController, CategoriesController],
  providers: [
    { provide: PRODUCT_REPOSITORY, useClass: PrismaProductRepository },
    { provide: CATEGORY_REPOSITORY, useClass: PrismaCategoryRepository },
    ListProductsUseCase,
    GetProductUseCase,
    GetRelatedProductsUseCase,
    GetFilterOptionsUseCase,
    ListCategoriesUseCase,
  ],
  // Orders y Cart van a necesitar leer productos y variantes.
  exports: [PRODUCT_REPOSITORY],
})
export class CatalogModule {}
