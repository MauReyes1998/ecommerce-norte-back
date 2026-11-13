import { Page } from '@/shared/pagination/pagination';
import { DeliveryMethod, Order, OrderStatus, PaymentStatus, ShippingAddress } from '../entities/order.entity';

export interface NewOrderItem {
  productId: string;
  variantId: string;
  productName: string;
  sku: string;
  size: string;
  color: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface NewOrder {
  userId: string | null;
  email: string;
  subtotal: number;
  shippingCost: number;
  total: number;
  discount: number;
  couponId: string | null;
  couponCode: string | null;
  shippingAddress: ShippingAddress;
  deliveryMethod: DeliveryMethod;
  items: NewOrderItem[];
}

export class OutOfStockError extends Error {
  constructor(public readonly sku: string) {
    super(`Sin stock suficiente para ${sku}`);
  }
}

export interface OrderListFilters {
  userId?: string;
  status?: OrderStatus;
  search?: string; // número de pedido o correo
}

export interface OrderRepository {
  /** Crea el pedido y descuenta stock en una sola transacción; lanza OutOfStockError si alguna variante no alcanza. */
  createWithStockDecrement(order: NewOrder): Promise<Order>;
  findById(id: string): Promise<Order | null>;
  findByNumber(number: number): Promise<Order | null>;
  findMany(filters: OrderListFilters, page: number, limit: number): Promise<Page<Order>>;
  setPreference(orderId: string, preferenceId: string): Promise<void>;
  markPaid(orderId: string, paymentId: string, paymentStatus: PaymentStatus): Promise<Order>;
  updateStatus(orderId: string, status: OrderStatus, actor?: string, note?: string): Promise<Order>;
  updateAdminFields(orderId: string, data: { trackingCarrier?: string | null; trackingNumber?: string | null; adminNote?: string | null }): Promise<Order>;
  /** Regresa el stock al cancelar un pedido que ya lo había descontado. */
  restoreStock(orderId: string): Promise<void>;
}

export const ORDER_REPOSITORY = Symbol('ORDER_REPOSITORY');
