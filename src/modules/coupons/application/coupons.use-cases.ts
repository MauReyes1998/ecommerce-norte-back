import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Coupon } from '../domain/coupon';
import { COUPON_REPOSITORY, CouponInput, CouponRepository } from '../domain/coupon.repository';
import { CreateCouponDto, UpdateCouponDto } from './dto/coupon.dto';

/** CRUD de cupones para el panel admin. La validación al usarlos vive en el dominio (checkCoupon). */
@Injectable()
export class CouponsUseCases {
  constructor(@Inject(COUPON_REPOSITORY) private readonly coupons: CouponRepository) {}

  list() {
    return this.coupons.list();
  }

  async create(dto: CreateCouponDto): Promise<Coupon> {
    const data = this.toInput(dto);
    if (await this.coupons.findByCode(data.code)) throw new ConflictException('Ya existe un cupón con ese código');
    return this.coupons.create(data);
  }

  async update(id: string, dto: UpdateCouponDto): Promise<Coupon> {
    const current = await this.get(id);
    // Lo que no venga en el PATCH se conserva.
    const data = this.toInput({
      code: dto.code ?? current.code,
      type: dto.type ?? current.type,
      value: dto.value ?? current.value,
      minSubtotal: dto.minSubtotal === undefined ? current.minSubtotal : dto.minSubtotal,
      startsAt: dto.startsAt === undefined ? current.startsAt?.toISOString() ?? null : dto.startsAt,
      endsAt: dto.endsAt === undefined ? current.endsAt?.toISOString() ?? null : dto.endsAt,
      maxUses: dto.maxUses === undefined ? current.maxUses : dto.maxUses,
      isActive: dto.isActive ?? current.isActive,
    });
    if (data.code !== current.code && (await this.coupons.findByCode(data.code))) {
      throw new ConflictException('Ya existe un cupón con ese código');
    }
    return this.coupons.update(id, data);
  }

  async remove(id: string): Promise<void> {
    await this.get(id);
    await this.coupons.remove(id);
  }

  private async get(id: string): Promise<Coupon> {
    const coupon = await this.coupons.findById(id);
    if (!coupon) throw new NotFoundException('Cupón no encontrado');
    return coupon;
  }

  private toInput(dto: CreateCouponDto): CouponInput {
    const value = dto.type === 'FREE_SHIPPING' ? 0 : dto.value ?? 0;
    if (dto.type === 'PERCENT' && (value <= 0 || value > 100)) throw new BadRequestException('El porcentaje debe estar entre 1 y 100');
    if (dto.type === 'FIXED' && value <= 0) throw new BadRequestException('El monto del descuento debe ser mayor a 0');

    const startsAt = dto.startsAt ? new Date(dto.startsAt) : null;
    const endsAt = dto.endsAt ? new Date(dto.endsAt) : null;
    if (startsAt && endsAt && endsAt < startsAt) throw new BadRequestException('La fecha de fin debe ser posterior a la de inicio');

    return {
      code: dto.code,
      type: dto.type,
      value,
      minSubtotal: dto.minSubtotal ?? null,
      startsAt,
      endsAt,
      maxUses: dto.maxUses ?? null,
      isActive: dto.isActive ?? true,
    };
  }
}
