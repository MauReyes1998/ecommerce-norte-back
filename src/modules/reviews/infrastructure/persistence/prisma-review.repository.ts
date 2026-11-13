import { Injectable } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { Page } from '@/shared/pagination/pagination';
import { ReviewInput, ReviewRepository, ReviewRow, ReviewSummary } from '../../domain/review.repository';

const select = {
  id: true, rating: true, title: true, body: true, createdAt: true, updatedAt: true,
  user: { select: { id: true, name: true } },
} satisfies Prisma.ReviewSelect;

const PURCHASED: OrderStatus[] = ['PAGADO', 'ENVIADO', 'ENTREGADO'];

@Injectable()
export class PrismaReviewRepository implements ReviewRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listByProduct(productId: string, page: number, limit: number): Promise<Page<ReviewRow>> {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.review.findMany({ where: { productId }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit, select }),
      this.prisma.review.count({ where: { productId } }),
    ]);
    return { items, total, page, limit };
  }

  async summary(productId: string): Promise<ReviewSummary> {
    const groups = await this.prisma.review.groupBy({ by: ['rating'], where: { productId }, _count: { _all: true } });
    const distribution: ReviewSummary['distribution'] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let count = 0;
    let sum = 0;
    for (const g of groups) {
      const r = Math.min(5, Math.max(1, g.rating)) as 1 | 2 | 3 | 4 | 5;
      distribution[r] += g._count._all;
      count += g._count._all;
      sum += g.rating * g._count._all;
    }
    return { average: count ? Math.round((sum / count) * 10) / 10 : 0, count, distribution };
  }

  findMine(productId: string, userId: string): Promise<ReviewRow | null> {
    return this.prisma.review.findUnique({ where: { productId_userId: { productId, userId } }, select });
  }

  findById(id: string): Promise<ReviewRow | null> {
    return this.prisma.review.findUnique({ where: { id }, select });
  }

  async hasPurchased(userId: string, productId: string): Promise<boolean> {
    const n = await this.prisma.orderItem.count({ where: { productId, order: { userId, status: { in: PURCHASED } } } });
    return n > 0;
  }

  upsert(data: ReviewInput): Promise<ReviewRow> {
    const { productId, userId, ...rest } = data;
    return this.prisma.review.upsert({
      where: { productId_userId: { productId, userId } },
      create: data,
      update: rest,
      select,
    });
  }

  async remove(id: string): Promise<void> {
    await this.prisma.review.delete({ where: { id } });
  }
}
