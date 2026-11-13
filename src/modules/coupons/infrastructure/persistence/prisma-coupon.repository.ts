import { Injectable } from '@nestjs/common';
import { Coupon as CouponRow } from '@prisma/client';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { toMoney } from '@/shared/utils/money';
import { Coupon } from '../../domain/coupon';
import { CouponInput, CouponRepository } from '../../domain/coupon.repository';

const toCoupon = (r: CouponRow): Coupon => ({
  id: r.id,
  code: r.code,
  type: r.type,
  value: toMoney(r.value) ?? 0,
  minSubtotal: toMoney(r.minSubtotal),
  startsAt: r.startsAt,
  endsAt: r.endsAt,
  maxUses: r.maxUses,
  usedCount: r.usedCount,
  isActive: r.isActive,
  createdAt: r.createdAt,
});

@Injectable()
export class PrismaCouponRepository implements CouponRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByCode(code: string): Promise<Coupon | null> {
    const row = await this.prisma.coupon.findUnique({ where: { code } });
    return row ? toCoupon(row) : null;
  }

  async findById(id: string): Promise<Coupon | null> {
    const row = await this.prisma.coupon.findUnique({ where: { id } });
    return row ? toCoupon(row) : null;
  }

  async list(): Promise<Coupon[]> {
    const rows = await this.prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map(toCoupon);
  }

  async create(data: CouponInput): Promise<Coupon> {
    return toCoupon(await this.prisma.coupon.create({ data }));
  }

  async update(id: string, data: CouponInput): Promise<Coupon> {
    return toCoupon(await this.prisma.coupon.update({ where: { id }, data }));
  }

  async remove(id: string): Promise<void> {
    // Los pedidos conservan couponCode; la relación queda en null (onDelete: SetNull).
    await this.prisma.coupon.delete({ where: { id } });
  }
}
