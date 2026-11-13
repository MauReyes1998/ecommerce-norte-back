import { Page } from '@/shared/pagination/pagination';

export interface ReviewRow {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  user: { id: string; name: string };
}

export interface ReviewSummary {
  average: number;
  count: number;
  /** Cuántas reseñas hay de cada estrella (1 a 5). */
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface ReviewInput {
  productId: string;
  userId: string;
  rating: number;
  title: string | null;
  body: string;
}

export interface ReviewRepository {
  listByProduct(productId: string, page: number, limit: number): Promise<Page<ReviewRow>>;
  summary(productId: string): Promise<ReviewSummary>;
  findMine(productId: string, userId: string): Promise<ReviewRow | null>;
  findById(id: string): Promise<ReviewRow | null>;
  /** true si el usuario tiene un pedido pagado (o enviado/entregado) con ese producto. */
  hasPurchased(userId: string, productId: string): Promise<boolean>;
  /** Una reseña por cliente y producto: si ya existe, se actualiza. */
  upsert(data: ReviewInput): Promise<ReviewRow>;
  remove(id: string): Promise<void>;
}

export const REVIEW_REPOSITORY = Symbol('REVIEW_REPOSITORY');
