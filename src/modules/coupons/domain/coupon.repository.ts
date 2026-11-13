import { Coupon, CouponType } from './coupon';

export interface CouponInput {
  code: string;
  type: CouponType;
  value: number;
  minSubtotal: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  maxUses: number | null;
  isActive: boolean;
}

export interface CouponRepository {
  findByCode(code: string): Promise<Coupon | null>;
  findById(id: string): Promise<Coupon | null>;
  list(): Promise<Coupon[]>;
  create(data: CouponInput): Promise<Coupon>;
  update(id: string, data: CouponInput): Promise<Coupon>;
  remove(id: string): Promise<void>;
}

export const COUPON_REPOSITORY = Symbol('COUPON_REPOSITORY');
