import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationQuery {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 24, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 24;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
}

export function toPageResponse<T, R>(page: Page<T>, present: (item: T) => R) {
  const totalPages = Math.max(1, Math.ceil(page.total / page.limit));
  const meta: PageMeta = {
    page: page.page,
    limit: page.limit,
    total: page.total,
    totalPages,
    hasNext: page.page < totalPages,
  };
  return { data: page.items.map(present), meta };
}
