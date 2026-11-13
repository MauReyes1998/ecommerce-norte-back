import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { AlertVariant, PendingAlert, StockAlertRepository } from '../../domain/stock-alert.repository';

@Injectable()
export class PrismaStockAlertRepository implements StockAlertRepository {
  constructor(private readonly prisma: PrismaService) {}

  findVariant(variantId: string): Promise<AlertVariant | null> {
    return this.prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { id: true, stock: true, isActive: true, product: { select: { slug: true, name: true, isActive: true } } },
    });
  }

  async subscribe(variantId: string, email: string): Promise<void> {
    await this.prisma.stockAlert.upsert({
      where: { variantId_email: { variantId, email } },
      create: { variantId, email },
      update: { notifiedAt: null },
    });
  }

  findPending(): Promise<PendingAlert[]> {
    return this.prisma.stockAlert.findMany({
      where: { notifiedAt: null, variant: { stock: { gt: 0 }, isActive: true, product: { isActive: true } } },
      select: {
        id: true, email: true,
        variant: { select: { id: true, size: true, color: true, stock: true, product: { select: { name: true, slug: true } } } },
      },
      take: 200,
    });
  }

  async markNotified(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.prisma.stockAlert.updateMany({ where: { id: { in: ids } }, data: { notifiedAt: new Date() } });
  }
}
