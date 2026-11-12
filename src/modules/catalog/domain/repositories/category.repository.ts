import { Category } from '../entities/category.entity';

export interface CategoryRepository {
  findTree(): Promise<Category[]>;
  findBySlug(slug: string): Promise<Category | null>;
}

export const CATEGORY_REPOSITORY = Symbol('CATEGORY_REPOSITORY');
