import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsDateString, IsIn, IsInt, IsNumber, IsOptional, Matches, Max, Min } from 'class-validator';
import { COUPON_TYPES, CouponType, normalizeCode } from '../../domain/coupon';

const upper = ({ value }: { value: unknown }) => (typeof value === 'string' ? normalizeCode(value) : value);

export class CreateCouponDto {
  @ApiProperty({ example: 'BIENVENIDO10', description: 'Se guarda en mayúsculas' })
  @Transform(upper)
  @Matches(/^[A-Z0-9_-]{3,30}$/, { message: 'Código de 3 a 30 caracteres: letras, números, guion o guion bajo' })
  code: string;

  @ApiProperty({ enum: COUPON_TYPES })
  @IsIn(COUPON_TYPES)
  type: CouponType;

  @ApiPropertyOptional({ example: 10, description: '% (1-100) para PERCENT, pesos para FIXED; se ignora en FREE_SHIPPING' })
  @IsOptional() @IsNumber() @Min(0) @Max(100_000)
  value?: number;

  @ApiPropertyOptional({ example: 500, description: 'Subtotal mínimo para poder usarlo' })
  @IsOptional() @IsNumber() @Min(0)
  minSubtotal?: number | null;

  @ApiPropertyOptional({ example: '2026-12-01T06:00:00.000Z' })
  @IsOptional() @IsDateString()
  startsAt?: string | null;

  @ApiPropertyOptional({ example: '2026-12-31T05:59:59.000Z' })
  @IsOptional() @IsDateString()
  endsAt?: string | null;

  @ApiPropertyOptional({ example: 100, description: 'Usos totales permitidos; vacío = ilimitado' })
  @IsOptional() @IsInt() @Min(1)
  maxUses?: number | null;

  @ApiPropertyOptional({ default: true })
  @IsOptional() @IsBoolean()
  isActive?: boolean;
}

export class UpdateCouponDto extends PartialType(CreateCouponDto) {}
