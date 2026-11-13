import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsUUID } from 'class-validator';

export class CreateStockAlertDto {
  @ApiProperty({ format: 'uuid', description: 'Variante (talla + color) agotada' })
  @IsUUID()
  variantId: string;

  @ApiPropertyOptional({ example: 'ana@correo.com', description: 'Obligatorio sin sesión; con sesión se usa el correo de la cuenta' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'Correo inválido' })
  email?: string;
}
