import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsIn, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { PaginationQuery } from '@/shared/pagination/pagination';
import { ProductSort } from '../../domain/repositories/product.repository';

const toArray = ({ value }: { value: unknown }) =>
  value === undefined ? undefined : String(value).split(',').map((v) => v.trim()).filter(Boolean);
const toBool = ({ value }: { value: unknown }) =>
  value === undefined ? undefined : value === true || value === 'true' || value === '1';

export class ListProductsQuery extends PaginationQuery {
  @ApiPropertyOptional({ description: 'Slug de categoría (incluye subcategorías)', example: 'hombre' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ enum: ['HOMBRE', 'MUJER', 'UNISEX'] })
  @IsOptional()
  @IsEnum(['HOMBRE', 'MUJER', 'UNISEX'])
  gender?: 'HOMBRE' | 'MUJER' | 'UNISEX';

  @ApiPropertyOptional({ description: 'Tallas separadas por coma', example: 'M,L,27' })
  @IsOptional()
  @Transform(toArray)
  @IsString({ each: true })
  sizes?: string[];

  @ApiPropertyOptional({ description: 'Colores separados por coma', example: 'Negro,Blanco' })
  @IsOptional()
  @Transform(toArray)
  @IsString({ each: true })
  colors?: string[];

  @ApiPropertyOptional({ example: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ example: 1500 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Solo productos en oferta' })
  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  onSale?: boolean;

  @ApiPropertyOptional({ description: 'Solo destacados' })
  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({ description: 'Búsqueda por nombre' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  search?: string;

  @ApiPropertyOptional({ enum: ['newest', 'price_asc', 'price_desc'], default: 'newest' })
  @IsOptional()
  @IsIn(['newest', 'price_asc', 'price_desc'])
  sort: ProductSort = 'newest';
}

export class FilterOptionsQuery {
  @ApiPropertyOptional({ example: 'mujer' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ enum: ['HOMBRE', 'MUJER', 'UNISEX'] })
  @IsOptional()
  @IsEnum(['HOMBRE', 'MUJER', 'UNISEX'])
  gender?: 'HOMBRE' | 'MUJER' | 'UNISEX';
}
