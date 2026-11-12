import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsEmail, IsIn, IsOptional, IsString, Matches, MaxLength, MinLength,
  ValidateNested,
} from 'class-validator';
import { CartItemDto } from '@/modules/cart/application/dto/cart.dto';
import { PaginationQuery } from '@/shared/pagination/pagination';
import { OrderStatus } from '../../domain/entities/order.entity';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export const MX_STATES = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua',
  'Ciudad de México', 'Coahuila', 'Colima', 'Durango', 'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo',
  'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo',
  'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas',
];

export class ShippingAddressDto {
  @ApiProperty({ example: 'Ana López' }) @Transform(trim) @IsString() @MinLength(3) @MaxLength(80) fullName: string;
  @ApiProperty({ example: '7221234567' }) @Transform(trim) @Matches(/^\d{10}$/, { message: 'Teléfono de 10 dígitos' }) phone: string;
  @ApiProperty({ example: 'Av. Tecnológico' }) @Transform(trim) @IsString() @MinLength(2) @MaxLength(120) street: string;
  @ApiProperty({ example: '1500' }) @Transform(trim) @IsString() @MaxLength(20) extNumber: string;
  @ApiPropertyOptional({ example: 'Depto 4' }) @IsOptional() @Transform(trim) @IsString() @MaxLength(20) intNumber?: string;
  @ApiProperty({ example: 'La Michoacana' }) @Transform(trim) @IsString() @MinLength(2) @MaxLength(80) neighborhood: string;
  @ApiProperty({ example: 'Metepec' }) @Transform(trim) @IsString() @MinLength(2) @MaxLength(80) city: string;
  @ApiProperty({ enum: MX_STATES, example: 'Estado de México' }) @IsIn(MX_STATES, { message: 'Estado inválido' }) state: string;
  @ApiProperty({ example: '52140' }) @Transform(trim) @Matches(/^\d{5}$/, { message: 'Código postal de 5 dígitos' }) postalCode: string;
  @ApiPropertyOptional({ example: 'Casa blanca, portón negro' }) @IsOptional() @Transform(trim) @IsString() @MaxLength(200) references?: string;
}

export class CreateOrderDto {
  @ApiProperty({ type: [CartItemDto] })
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(50) @ValidateNested({ each: true }) @Type(() => CartItemDto)
  items: CartItemDto[];

  @ApiProperty({ type: ShippingAddressDto })
  @ValidateNested() @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @ApiPropertyOptional({ description: 'Obligatorio si compra como invitado', example: 'ana@correo.com' })
  @IsOptional() @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'Correo inválido' })
  email?: string;
}

export class ListOrdersQuery extends PaginationQuery {
  @ApiPropertyOptional({ enum: ['PENDIENTE', 'PAGADO', 'ENVIADO', 'ENTREGADO', 'CANCELADO'] })
  @IsOptional() @IsIn(['PENDIENTE', 'PAGADO', 'ENVIADO', 'ENTREGADO', 'CANCELADO'])
  status?: OrderStatus;

  @ApiPropertyOptional({ description: 'Número de pedido (123 o NOR-000123) o correo' })
  @IsOptional() @Transform(trim) @IsString() @MaxLength(80)
  search?: string;
}

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: ['PAGADO', 'ENVIADO', 'ENTREGADO', 'CANCELADO'] })
  @IsIn(['PAGADO', 'ENVIADO', 'ENTREGADO', 'CANCELADO'])
  status: Exclude<OrderStatus, 'PENDIENTE'>;
}
