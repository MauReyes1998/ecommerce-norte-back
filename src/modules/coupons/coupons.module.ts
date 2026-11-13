import { Module } from '@nestjs/common';
import { AuthModule } from '@/modules/auth/auth.module';
import { COUPON_REPOSITORY } from './domain/coupon.repository';
import { PrismaCouponRepository } from './infrastructure/persistence/prisma-coupon.repository';
import { CouponsUseCases } from './application/coupons.use-cases';
import { AdminCouponsController } from './infrastructure/http/admin-coupons.controller';

@Module({
  imports: [AuthModule],
  controllers: [AdminCouponsController],
  providers: [{ provide: COUPON_REPOSITORY, useClass: PrismaCouponRepository }, CouponsUseCases],
  // El carrito lo necesita para cotizar con cupón.
  exports: [COUPON_REPOSITORY],
})
export class CouponsModule {}
