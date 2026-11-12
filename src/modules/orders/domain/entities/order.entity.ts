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
  shippingAddress: ShippingAddress;
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
