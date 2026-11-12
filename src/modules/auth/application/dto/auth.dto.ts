import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

const trimLower = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value);
const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class RegisterDto {
  @ApiProperty({ example: 'ana@correo.com' })
  @Transform(trimLower)
  @IsEmail({}, { message: 'Correo inválido' })
  email: string;

  @ApiProperty({ example: 'Ana López' })
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name: string;

  @ApiPropertyOptional({ example: '7221234567', description: '10 dígitos' })
  @IsOptional()
  @Transform(trim)
  @Matches(/^\d{10}$/, { message: 'El teléfono debe tener 10 dígitos' })
  phone?: string;

  @ApiProperty({ example: 'MiClave123', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(72)
  @Matches(/(?=.*[A-Za-z])(?=.*\d)/, { message: 'La contraseña debe incluir letras y números' })
  password: string;
}

export class LoginDto {
  @ApiProperty({ example: 'admin@norte.mx' })
  @Transform(trimLower)
  @IsEmail({}, { message: 'Correo inválido' })
  email: string;

  @ApiProperty({ example: 'Admin123!' })
  @IsString()
  @MinLength(1)
  password: string;
}

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Ana López' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;

  @ApiPropertyOptional({ example: '7221234567' })
  @IsOptional()
  @Transform(trim)
  @Matches(/^\d{10}$/, { message: 'El teléfono debe tener 10 dígitos' })
  phone?: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'ana@correo.com' })
  @Transform(trimLower)
  @IsEmail({}, { message: 'Correo inválido' })
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(20)
  token: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(72)
  @Matches(/(?=.*[A-Za-z])(?=.*\d)/, { message: 'La contraseña debe incluir letras y números' })
  password: string;
}
