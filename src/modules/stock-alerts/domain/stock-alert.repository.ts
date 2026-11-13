export interface AlertVariant {
  id: string;
  stock: number;
  isActive: boolean;
  product: { slug: string; name: string; isActive: boolean };
}

export interface PendingAlert {
  id: string;
  email: string;
  variant: { id: string; size: string; color: string; stock: number; product: { name: string; slug: string } };
}

export interface StockAlertRepository {
  findVariant(variantId: string): Promise<AlertVariant | null>;
  /** Crea la suscripción o la reactiva si ya existía y ya se había avisado. */
  subscribe(variantId: string, email: string): Promise<void>;
  /** Suscripciones sin avisar cuyas variantes ya tienen stock. */
  findPending(): Promise<PendingAlert[]>;
  markNotified(ids: string[]): Promise<void>;
}

export const STOCK_ALERT_REPOSITORY = Symbol('STOCK_ALERT_REPOSITORY');
