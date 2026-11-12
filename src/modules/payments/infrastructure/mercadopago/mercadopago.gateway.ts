import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { formatOrderNumber, Order, PaymentStatus } from '@/modules/orders/domain/entities/order.entity';
import { CheckoutSession, PaymentGateway, PaymentNotification } from '@/modules/orders/domain/services/payment-gateway';

/**
 * Adaptador de Mercado Pago Checkout Pro usando la API REST (sin SDK).
 * Docs: https://www.mercadopago.com.mx/developers/es/docs/checkout-pro
 * En modo prueba usa un access token TEST- y tarjetas de prueba de Mercado Pago.
 */
@Injectable()
export class MercadoPagoGateway implements PaymentGateway {
  private readonly logger = new Logger(MercadoPagoGateway.name);
  private readonly api = 'https://api.mercadopago.com';

  constructor(private readonly config: ConfigService) {}

  private get token() {
    return this.config.get<string>('MP_ACCESS_TOKEN', '');
  }

  private get configured() {
    return this.token.length > 0 && !this.token.includes('xxxx');
  }

  async createCheckout(order: Order): Promise<CheckoutSession> {
    const frontend = this.config.get<string>('FRONTEND_URL', 'http://localhost:5173');
    if (!this.configured) {
      // Sin token: regresa un link simulado para que el flujo se pueda probar en local.
      this.logger.warn('MP_ACCESS_TOKEN no configurado; usando checkout simulado');
      return { preferenceId: `FAKE-${order.id}`, initPoint: `${frontend}/pago/simulado/${order.id}` };
    }

    const body = {
      external_reference: order.id,
      items: order.items.map((i) => ({
        id: i.sku,
        title: `${i.productName} (${i.size} / ${i.color})`,
        quantity: i.quantity,
        unit_price: i.unitPrice,
        currency_id: 'MXN',
      })),
      shipments: { cost: order.shippingCost, mode: 'not_specified' },
      payer: { email: order.email, name: order.shippingAddress.fullName },
      back_urls: {
        success: `${frontend}/pedido/${order.id}?pago=exito`,
        pending: `${frontend}/pedido/${order.id}?pago=pendiente`,
        failure: `${frontend}/pedido/${order.id}?pago=error`,
      },
      auto_return: 'approved',
      notification_url: this.config.get<string>('MP_WEBHOOK_URL'),
      statement_descriptor: 'NORTE',
      metadata: { order_number: formatOrderNumber(order.number) },
    };

    const res = await fetch(`${this.api}/checkout/preferences`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      this.logger.error(`Mercado Pago ${res.status}: ${await res.text()}`);
      throw new ServiceUnavailableException('No se pudo iniciar el pago. Intenta de nuevo.');
    }
    const data = (await res.json()) as { id: string; init_point: string; sandbox_init_point?: string };
    const useSandbox = this.token.startsWith('TEST-') && data.sandbox_init_point;
    return { preferenceId: data.id, initPoint: useSandbox ? (data.sandbox_init_point as string) : data.init_point };
  }

  async fetchPayment(paymentId: string): Promise<PaymentNotification | null> {
    if (!this.configured) return null;
    const res = await fetch(`${this.api}/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new ServiceUnavailableException('Mercado Pago no respondió');
    const data = (await res.json()) as { id: number; status: string; external_reference?: string };
    if (!data.external_reference) return null;
    return { orderId: data.external_reference, paymentId: String(data.id), status: this.mapStatus(data.status) };
  }

  private mapStatus(status: string): PaymentStatus {
    switch (status) {
      case 'approved': return 'APPROVED';
      case 'rejected': case 'cancelled': return 'REJECTED';
      case 'refunded': case 'charged_back': return 'REFUNDED';
      default: return 'PENDING';
    }
  }
}
