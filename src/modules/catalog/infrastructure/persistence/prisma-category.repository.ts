import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { Category } from '../../domain/entities/category.entity';
import { CategoryRepository } from '../../domain/repositories/category.repository';

@Injectable()
export class PrismaCategoryRepository implements CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findTree(): Promise<Category[]> {
    const rows = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    const byParent = new Map<string | null, Category[]>();
    rows.forEach((r) => {
      const node: Category = { ...r, children: [] };
      byParent.set(r.parentId, [...(byParent.get(r.parentId) ?? []), node]);
    });
    const attach = (node: Category): Category => ({
      ...node,
      children: (byParent.get(node.id) ?? []).map(attach),
    });
    return (byParent.get(null) ?? []).map(attach);
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const row = await this.prisma.category.findUnique({ where: { slug } });
    return row ? { ...row, children: [] } : null;
  }
}
