import { Inject, Injectable } from '@nestjs/common';
import { CATEGORY_REPOSITORY, CategoryRepository } from '../../domain/repositories/category.repository';

@Injectable()
export class ListCategoriesUseCase {
  constructor(@Inject(CATEGORY_REPOSITORY) private readonly categories: CategoryRepository) {}

  execute() {
    return this.categories.findTree();
  }
}
