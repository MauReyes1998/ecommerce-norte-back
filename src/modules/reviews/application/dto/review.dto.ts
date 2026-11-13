import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class UpsertReviewDto {
  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsInt() @Min(1) @Max(5)
  rating: number;

  @ApiPropertyOptional({ example: 'Me quedó perfecta' })
  @IsOptional() @Transform(trim) @IsString() @MaxLength(80)
  title?: string;

  @ApiProperty({ example: 'La tela es gruesa y la talla M me quedó como esperaba.' })
  @Transform(trim) @IsString()
  @MinLength(10, { message: 'Cuéntanos un poco más (mínimo 10 caracteres)' })
  @MaxLength(1000)
  body: string;
}
