import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { slugify } from '@/shared/utils/slug';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/admin.dto';
import { ADMIN_CATEGORY_REPOSITORY, AdminCategoryRepository } from '../../domain/admin.repository';

@Injectable()
export class AdminCategoriesUseCases {
  constructor(@Inject(ADMIN_CATEGORY_REPOSITORY) private readonly categories: AdminCategoryRepository) {}

  list() {
    return this.categories.findAll();
  }

  create(dto: CreateCategoryDto) {
    return this.categories.create({
      name: dto.name,
      slug: dto.slug ?? slugify(dto.name),
      parentId: dto.parentId ?? null,
      imageUrl: dto.imageUrl ?? null,
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive ?? true,
    });
  }

  update(id: string, dto: UpdateCategoryDto) {
    return this.categories.update(id, dto);
  }

  async remove(id: string) {
    const count = await this.categories.productCount(id);
    if (count > 0) throw new ConflictException(`La categoría tiene ${count} productos; muévelos antes de borrarla`);
    await this.categories.remove(id);
  }
}
