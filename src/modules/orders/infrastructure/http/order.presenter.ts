import { formatOrderNumber, Order } from '../../domain/entities/order.entity';

export const OrderPresenter = {
  full(o: Order) {
    return {
      id: o.id,
      number: formatOrderNumber(o.number),
      email: o.email,
      status: o.status,
      paymentStatus: o.paymentStatus,
      subtotal: o.subtotal,
      shippingCost: o.shippingCost,
      total: o.total,
      shippingAddress: o.shippingAddress,
      paidAt: o.paidAt,
      trackingCarrier: o.trackingCarrier,
      trackingNumber: o.trackingNumber,
      createdAt: o.createdAt,
      items: o.items,
    };
  },
  /** Vista del panel admin: incluye guía, nota interna e historial. */
  admin(o: Order) {
    return {
      ...OrderPresenter.full(o),
      userId: o.userId,
      mpPaymentId: o.mpPaymentId,
      trackingCarrier: o.trackingCarrier,
      trackingNumber: o.trackingNumber,
      adminNote: o.adminNote,
      history: o.history,
      itemCount: o.items.reduce((acc, i) => acc + i.quantity, 0),
    };
  },
  summary(o: Order) {
    return {
      id: o.id,
      number: formatOrderNumber(o.number),
      email: o.email,
      status: o.status,
      total: o.total,
      itemCount: o.items.reduce((acc, i) => acc + i.quantity, 0),
      firstImage: o.items[0]?.imageUrl ?? null,
      createdAt: o.createdAt,
    };
  },
};
