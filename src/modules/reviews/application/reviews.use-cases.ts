import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PRODUCT_REPOSITORY, ProductRepository } from '@/modules/catalog/domain/repositories/product.repository';
import { AuthUser } from '@/shared/auth/current-user';
import { REVIEW_REPOSITORY, ReviewRepository, ReviewRow, ReviewSummary } from '../domain/review.repository';
import { UpsertReviewDto } from './dto/review.dto';
import { Page } from '@/shared/pagination/pagination';

export interface ProductReviews {
  page: Page<ReviewRow>;
  summary: ReviewSummary;
  /** Reseña del usuario autenticado, si ya dejó una. */
  mine: ReviewRow | null;
  /** true solo si compró el producto (pedido pagado, enviado o entregado). */
  canReview: boolean;
}

@Injectable()
export class ReviewsUseCases {
  constructor(
    @Inject(REVIEW_REPOSITORY) private readonly reviews: ReviewRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
  ) {}

  async list(slug: string, page: number, limit: number, user: AuthUser | null): Promise<ProductReviews> {
    const product = await this.product(slug);
    const [list, summary, mine, purchased] = await Promise.all([
      this.reviews.listByProduct(product.id, page, limit),
      this.reviews.summary(product.id),
      user ? this.reviews.findMine(product.id, user.id) : null,
      user ? this.reviews.hasPurchased(user.id, product.id) : false,
    ]);
    return { page: list, summary, mine, canReview: purchased };
  }

  async upsert(slug: string, user: AuthUser, dto: UpsertReviewDto): Promise<ReviewRow> {
    const product = await this.product(slug);
    if (!(await this.reviews.hasPurchased(user.id, product.id))) {
      throw new ForbiddenException('Solo quienes ya compraron este producto pueden reseñarlo');
    }
    return this.reviews.upsert({ productId: product.id, userId: user.id, rating: dto.rating, title: dto.title || null, body: dto.body });
  }

  /** Moderación del admin. */
  async remove(id: string): Promise<void> {
    if (!(await this.reviews.findById(id))) throw new NotFoundException('Reseña no encontrada');
    await this.reviews.remove(id);
  }

  private async product(slug: string) {
    const product = await this.products.findBySlug(slug);
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }
}
