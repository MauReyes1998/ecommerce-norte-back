import { Body, Controller, HttpCode, Post, Query } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { ProcessPaymentNotificationUseCase } from '@/modules/orders/application/use-cases/process-payment-notification.use-case';

interface MpWebhookBody {
  type?: string;
  action?: string;
  data?: { id?: string | number };
}

@ApiTags('Pagos')
@Controller({ path: 'payments', version: '1' })
export class PaymentsController {
  constructor(private readonly processNotification: ProcessPaymentNotificationUseCase) {}

  /**
   * Mercado Pago manda {type:"payment", data:{id}} en el cuerpo o ?type=payment&data.id= en la URL.
   * Siempre responde 200 rápido; el estado real se consulta a Mercado Pago, no se confía en el cuerpo.
   */
  @Post('webhook')
  @HttpCode(200)
  @ApiExcludeEndpoint()
  async webhook(@Body() body: MpWebhookBody, @Query('type') type?: string, @Query('data.id') dataId?: string) {
    const kind = body?.type ?? type;
    const paymentId = body?.data?.id ?? dataId;
    if (kind !== 'payment' || !paymentId) return { received: true };
    await this.processNotification.execute(String(paymentId));
    return { received: true };
  }
}
