import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import { DELIVERY_METHODS, DeliveryMethod, MAX_QTY_PER_LINE } from '../../domain/cart';

export class CartItemDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  variantId: string;

  @ApiProperty({ example: 1, minimum: 1, maximum: MAX_QTY_PER_LINE })
  @IsInt()
  @Min(1)
  @Max(MAX_QTY_PER_LINE)
  quantity: number;
}

export class CartDto {
  @ApiProperty({ type: [CartItemDto] })
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items: CartItemDto[];

  @ApiPropertyOptional({ enum: DELIVERY_METHODS, default: 'ENVIO', description: 'RECOGER = recoger en tienda, sin costo de envío' })
  @IsOptional()
  @IsIn(DELIVERY_METHODS)
  deliveryMethod?: DeliveryMethod;

  @ApiPropertyOptional({ example: 'BIENVENIDO10', description: 'Código de cupón; la respuesta dice si aplicó o por qué no' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(30)
  couponCode?: string;
}
