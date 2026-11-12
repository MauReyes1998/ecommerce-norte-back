import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsInt, IsUUID, Max, Min, ValidateNested } from 'class-validator';
import { MAX_QTY_PER_LINE } from '../../domain/cart';

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
}
