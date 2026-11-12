import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListCategoriesUseCase } from '../../application/use-cases/list-categories.use-case';
import { CategoryPresenter } from './presenters/product.presenter';

@ApiTags('Catálogo')
@Controller({ path: 'categories', version: '1' })
export class CategoriesController {
  constructor(private readonly listCategories: ListCategoriesUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Árbol de categorías (Hombre, Mujer y subcategorías)' })
  async list() {
    const tree = await this.listCategories.execute();
    return tree.map(CategoryPresenter.tree);
  }
}
