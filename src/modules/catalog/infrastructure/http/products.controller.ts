import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { toPageResponse } from '@/shared/pagination/pagination';
import { FilterOptionsQuery, ListProductsQuery } from '../../application/dto/list-products.query';
import { ListProductsUseCase } from '../../application/use-cases/list-products.use-case';
import { GetProductUseCase } from '../../application/use-cases/get-product.use-case';
import { GetRelatedProductsUseCase } from '../../application/use-cases/get-related-products.use-case';
import { GetFilterOptionsUseCase } from '../../application/use-cases/get-filter-options.use-case';
import { ProductPresenter } from './presenters/product.presenter';

@ApiTags('Catálogo')
@Controller({ path: 'products', version: '1' })
export class ProductsController {
  constructor(
    private readonly listProducts: ListProductsUseCase,
    private readonly getProduct: GetProductUseCase,
    private readonly getRelated: GetRelatedProductsUseCase,
    private readonly getFilterOptions: GetFilterOptionsUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lista de productos con filtros, orden y paginación' })
  async list(@Query() query: ListProductsQuery) {
    const page = await this.listProducts.execute(query);
    return toPageResponse(page, ProductPresenter.summary);
  }

  @Get('filters')
  @ApiOperation({ summary: 'Tallas, colores y rango de precios disponibles' })
  filters(@Query() query: FilterOptionsQuery) {
    return this.getFilterOptions.execute(query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Detalle de producto con variantes y galería' })
  @ApiOkResponse({ description: 'Producto encontrado' })
  async detail(@Param('slug') slug: string) {
    return ProductPresenter.detail(await this.getProduct.execute(slug));
  }

  @Get(':slug/related')
  @ApiOperation({ summary: 'Productos relacionados (misma categoría)' })
  async related(@Param('slug') slug: string) {
    const items = await this.getRelated.execute(slug);
    return items.map(ProductPresenter.summary);
  }
}
