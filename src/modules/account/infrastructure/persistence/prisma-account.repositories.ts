import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { productSummaryInclude, toProductSummary } from '@/modules/catalog/infrastructure/persistence/product.mapper';
import { Address, AddressRepository, FavoriteRepository, NewAddress } from '../../domain/account.repository';

@Injectable()
export class PrismaAddressRepository implements AddressRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUser(userId: string): Promise<Address[]> {
    return this.prisma.address.findMany({ where: { userId }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] });
  }

  findOne(userId: string, id: string): Promise<Address | null> {
    return this.prisma.address.findFirst({ where: { id, userId } });
  }

  create(userId: string, data: NewAddress): Promise<Address> {
    return this.prisma.address.create({ data: { ...data, userId } });
  }

  update(userId: string, id: string, data: Partial<NewAddress>): Promise<Address> {
    return this.prisma.address.update({ where: { id, userId }, data });
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.prisma.address.delete({ where: { id, userId } });
  }

  async clearDefault(userId: string): Promise<void> {
    await this.prisma.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
  }
}

@Injectable()
export class PrismaFavoriteRepository implements FavoriteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUser(userId: string) {
    const rows = await this.prisma.favorite.findMany({
      where: { userId, product: { isActive: true } },
      orderBy: { createdAt: 'desc' },
      include: { product: { include: productSummaryInclude } },
    });
    return rows.map((r) => toProductSummary(r.product));
  }

  async idsByUser(userId: string) {
    const rows = await this.prisma.favorite.findMany({ where: { userId }, select: { productId: true } });
    return rows.map((r) => r.productId);
  }

  async add(userId: string, productId: string) {
    await this.prisma.favorite.upsert({
      where: { userId_productId: { userId, productId } },
      create: { userId, productId },
      update: {},
    });
  }

  async remove(userId: string, productId: string) {
    await this.prisma.favorite.deleteMany({ where: { userId, productId } });
  }
}
