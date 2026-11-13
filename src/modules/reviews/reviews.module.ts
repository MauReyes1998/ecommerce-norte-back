import { Module } from '@nestjs/common';
import { AuthModule } from '@/modules/auth/auth.module';
import { CatalogModule } from '@/modules/catalog/catalog.module';
import { REVIEW_REPOSITORY } from './domain/review.repository';
import { PrismaReviewRepository } from './infrastructure/persistence/prisma-review.repository';
import { ReviewsUseCases } from './application/reviews.use-cases';
import { AdminReviewsController, ReviewsController } from './infrastructure/http/reviews.controller';

@Module({
  imports: [AuthModule, CatalogModule],
  controllers: [ReviewsController, AdminReviewsController],
  providers: [{ provide: REVIEW_REPOSITORY, useClass: PrismaReviewRepository }, ReviewsUseCases],
})
export class ReviewsModule {}
