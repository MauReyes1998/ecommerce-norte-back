import { Order, PaymentStatus } from '../entities/order.entity';

export interface CheckoutSession {
  preferenceId: string;
  /** URL a la que se manda al cliente para pagar (Checkout Pro). */
  initPoint: string;
}

export interface PaymentNotification {
  orderId: string; // external_reference
  paymentId: string;
  status: PaymentStatus;
}

/** Puerto de pagos: Orders no sabe que detrás está Mercado Pago. */
export interface PaymentGateway {
  createCheckout(order: Order): Promise<CheckoutSession>;
  /** Consulta el pago en el proveedor a partir del id que llega por webhook. */
  fetchPayment(paymentId: string): Promise<PaymentNotification | null>;
}

export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');
