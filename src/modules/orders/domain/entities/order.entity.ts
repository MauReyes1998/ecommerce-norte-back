import type { DeliveryMethod } from '@/modules/cart/domain/cart';

export type { DeliveryMethod };
export type OrderStatus = 'PENDIENTE' | 'PAGADO' | 'ENVIADO' | 'ENTREGADO' | 'CANCELADO';
export type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REFUNDED';

export interface ShippingAddress {
  fullName: string;
  phone: string;
  street: string;
  extNumber: string;
  intNumber?: string | null;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
  references?: string | null;
}

export interface OrderItem {
  id: string;
  productId: string | null;
  variantId: string | null;
  productName: string;
  sku: string;
  size: string;
  color: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  imageUrl?: string | null;
}

export interface Order {
  id: string;
  number: number;
  userId: string | null;
  email: string;
  status: OrderStatus;
  subtotal: number;
  shippingCost: number;
  total: number;
  /** Descuento del cupón, ya restado en total. */
  discount: number;
  couponCode: string | null;
  shippingAddress: ShippingAddress;
  deliveryMethod: DeliveryMethod;
  paymentProvider: string;
  paymentStatus: PaymentStatus;
  mpPreferenceId: string | null;
  mpPaymentId: string | null;
  paidAt: Date | null;
  trackingCarrier: string | null;
  trackingNumber: string | null;
  adminNote: string | null;
  items: OrderItem[];
  history: OrderEvent[];
  createdAt: Date;
}

export interface OrderEvent {
  id: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  note: string | null;
  actor: string;
  createdAt: Date;
}

export const formatOrderNumber = (n: number) => `NOR-${String(n).padStart(6, '0')}`;

/**
 * Dirección de la tienda física. En pedidos "recoger en tienda" se guarda como dirección del pedido
 * (con el nombre y teléfono de quien recoge). Cámbiala por la dirección real; el front tiene una copia
 * en features/checkout/pickup.ts.
 */
export const PICKUP_LOCATION: Omit<ShippingAddress, 'fullName' | 'phone'> = {
  street: 'Av. Tecnológico',
  extNumber: '1500',
  intNumber: null,
  neighborhood: 'La Michoacana',
  city: 'Metepec',
  state: 'Estado de México',
  postalCode: '52140',
  references: 'Recoger en tienda · Lun a Sáb 11:00–20:00',
};

/** Transiciones válidas de estatus (el admin no puede, p. ej., entregar un pedido cancelado). */
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDIENTE: ['PAGADO', 'CANCELADO'],
  PAGADO: ['ENVIADO', 'CANCELADO'],
  ENVIADO: ['ENTREGADO'],
  ENTREGADO: [],
  CANCELADO: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from].includes(to);
}
