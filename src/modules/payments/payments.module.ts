import { forwardRef, Module } from '@nestjs/common';
import { OrdersModule } from '@/modules/orders/orders.module';
import { PAYMENT_GATEWAY } from '@/modules/orders/domain/services/payment-gateway';
import { MercadoPagoGateway } from './infrastructure/mercadopago/mercadopago.gateway';
import { PaymentsController } from './infrastructure/http/payments.controller';

/**
 * Payments provee el adaptador (PAYMENT_GATEWAY) que Orders consume, y el webhook consume un caso de uso de Orders.
 * Por eso la dependencia es circular y se resuelve con forwardRef.
 */
@Module({
  imports: [forwardRef(() => OrdersModule)],
  controllers: [PaymentsController],
  providers: [{ provide: PAYMENT_GATEWAY, useClass: MercadoPagoGateway }],
  exports: [PAYMENT_GATEWAY],
})
export class PaymentsModule {}
