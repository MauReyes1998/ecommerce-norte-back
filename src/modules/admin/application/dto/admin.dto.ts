import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsEnum, IsIn, IsInt, IsNumber, IsOptional, IsString, IsUUID, Matches,
  MaxLength, Min, MinLength, ValidateNested,
} from 'class-validator';
import { PaginationQuery } from '@/shared/pagination/pagination';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const toBool = ({ value }: { value: unknown }) => (value === undefined ? undefined : value === true || value === 'true' || value === '1');

export class VariantDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Si viene, se actualiza; si no, se crea' }) @IsOptional() @IsUUID() id?: string;
  @ApiProperty({ example: 'NOR-021-NEG-M' }) @Transform(trim) @IsString() @MinLength(3) @MaxLength(40) sku: string;
  @ApiProperty({ example: 'M' }) @Transform(trim) @IsString() @MinLength(1) @MaxLength(10) size: string;
  @ApiProperty({ example: 'Negro' }) @Transform(trim) @IsString() @MinLength(2) @MaxLength(30) color: string;
  @ApiPropertyOptional({ example: '#111111' }) @IsOptional() @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'Color hex inválido' }) colorHex?: string | null;
  @ApiProperty({ example: 10 }) @IsInt() @Min(0) stock: number;
  @ApiPropertyOptional({ example: 399 }) @IsOptional() @IsNumber() @Min(0) price?: number | null;
  @ApiPropertyOptional({ example: 299 }) @IsOptional() @IsNumber() @Min(0) salePrice?: number | null;
  @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean() isActive?: boolean;
}

export class CreateProductDto {
  @ApiProperty({ example: 'Playera Oversize Básica' }) @Transform(trim) @IsString() @MinLength(3) @MaxLength(120) name: string;
  @ApiPropertyOptional({ description: 'Se genera del nombre si no viene' }) @IsOptional() @Transform(trim) @Matches(/^[a-z0-9-]+$/) slug?: string;
  @ApiProperty() @Transform(trim) @IsString() @MinLength(10) @MaxLength(2000) description: string;
  @ApiProperty({ enum: ['HOMBRE', 'MUJER', 'UNISEX'] }) @IsEnum(['HOMBRE', 'MUJER', 'UNISEX']) gender: 'HOMBRE' | 'MUJER' | 'UNISEX';
  @ApiProperty({ format: 'uuid' }) @IsUUID() categoryId: string;
  @ApiProperty({ example: 349 }) @IsNumber() @Min(1) basePrice: number;
  @ApiPropertyOptional({ example: 299, nullable: true }) @IsOptional() @IsNumber() @Min(1) salePrice?: number | null;
  @ApiPropertyOptional({ default: false }) @IsOptional() @IsBoolean() isFeatured?: boolean;
  @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiProperty({ type: [VariantDto] }) @IsArray() @ArrayMinSize(1) @ArrayMaxSize(200) @ValidateNested({ each: true }) @Type(() => VariantDto) variants: VariantDto[];
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}

export class ListAdminProductsQuery extends PaginationQuery {
  @ApiPropertyOptional() @IsOptional() @Transform(trim) @IsString() @MaxLength(80) search?: string;
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() categoryId?: string;
  @ApiPropertyOptional() @IsOptional() @Transform(toBool) @IsBoolean() isActive?: boolean;
  @ApiPropertyOptional({ description: 'Solo productos con alguna variante con stock bajo' }) @IsOptional() @Transform(toBool) @IsBoolean() lowStock?: boolean;
}

export class ReorderImagesDto {
  @ApiProperty({ type: [String] }) @IsArray() @ArrayMinSize(1) @IsUUID('4', { each: true }) imageIds: string[];
}

export class CreateCategoryDto {
  @ApiProperty({ example: 'Shorts' }) @Transform(trim) @IsString() @MinLength(2) @MaxLength(60) name: string;
  @ApiPropertyOptional() @IsOptional() @Transform(trim) @Matches(/^[a-z0-9-]+$/) slug?: string;
  @ApiPropertyOptional({ format: 'uuid', nullable: true }) @IsOptional() @IsUUID() parentId?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) imageUrl?: string | null;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsInt() @Min(0) sortOrder?: number;
  @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}

export class DashboardQuery {
  @ApiPropertyOptional({ enum: [7, 30, 90], default: 30 })
  @IsOptional() @Type(() => Number) @IsIn([7, 30, 90])
  range: 7 | 30 | 90 = 30;
}

export class BulkProductsDto {
  @ApiProperty({ type: [String], format: 'uuid' }) @IsArray() @ArrayMaxSize(200) @IsUUID('4', { each: true }) ids: string[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isFeatured?: boolean;
}

export class VariantStockDto {
  @ApiProperty({ minimum: 0 }) @IsInt() @Min(0) stock: number;
}

export class ListCustomersQuery extends PaginationQuery {
  @ApiPropertyOptional() @IsOptional() @Transform(trim) @IsString() @MaxLength(80) search?: string;
}

export class UpdateAdminOrderDto {
  @ApiPropertyOptional({ example: 'Estafeta' }) @IsOptional() @Transform(trim) @IsString() @MaxLength(60) trackingCarrier?: string | null;
  @ApiPropertyOptional({ example: '1234567890' }) @IsOptional() @Transform(trim) @IsString() @MaxLength(80) trackingNumber?: string | null;
  @ApiPropertyOptional({ description: 'Nota interna, no la ve el cliente' }) @IsOptional() @IsString() @MaxLength(1000) adminNote?: string | null;
}

export class AdminOrderStatusDto {
  @ApiProperty({ enum: ['PAGADO', 'ENVIADO', 'ENTREGADO', 'CANCELADO'] })
  @IsIn(['PAGADO', 'ENVIADO', 'ENTREGADO', 'CANCELADO'])
  status: 'PAGADO' | 'ENVIADO' | 'ENTREGADO' | 'CANCELADO';
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(300) note?: string;
}
