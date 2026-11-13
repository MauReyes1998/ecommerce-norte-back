import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthUser, CurrentUser } from '@/shared/auth/current-user';
import { JwtAuthGuard } from '@/shared/auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '@/shared/auth/optional-jwt-auth.guard';
import { Roles } from '@/shared/auth/roles.decorator';
import { RolesGuard } from '@/shared/auth/roles.guard';
import { PaginationQuery, toPageResponse } from '@/shared/pagination/pagination';
import { UpsertReviewDto } from '../../application/dto/review.dto';
import { ReviewsUseCases } from '../../application/reviews.use-cases';
import { ReviewPresenter } from './review.presenter';

@ApiTags('Reseñas')
@Controller({ path: 'products/:slug/reviews', version: '1' })
export class ReviewsController {
  constructor(private readonly reviews: ReviewsUseCases) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reseñas del producto con promedio, distribución y si el usuario puede reseñar' })
  async list(@Param('slug') slug: string, @Query() q: PaginationQuery, @CurrentUser() user: AuthUser | null) {
    const r = await this.reviews.list(slug, q.page, Math.min(q.limit, 20), user);
    return {
      ...toPageResponse(r.page, (row) => ReviewPresenter.item(row, user?.id)),
      summary: r.summary,
      canReview: r.canReview,
      mine: r.mine ? ReviewPresenter.item(r.mine, user?.id) : null,
    };
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear o actualizar mi reseña (solo si compré el producto)' })
  async upsert(@Param('slug') slug: string, @Body() dto: UpsertReviewDto, @CurrentUser() user: AuthUser) {
    return ReviewPresenter.item(await this.reviews.upsert(slug, user, dto), user.id);
  }
}

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller({ path: 'admin/reviews', version: '1' })
export class AdminReviewsController {
  constructor(private readonly reviews: ReviewsUseCases) {}

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Eliminar una reseña (moderación)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.reviews.remove(id);
  }
}
