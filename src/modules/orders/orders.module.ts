import { NotificationsModule } from '../notifications/notifications.module';
import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '@/modules/auth/auth.module';
import { CartModule } from '@/modules/cart/cart.module';
import { PaymentsModule } from '@/modules/payments/payments.module';
import { ORDER_REPOSITORY } from './domain/repositories/order.repository';
import { PrismaOrderRepository } from './infrastructure/persistence/prisma-order.repository';
import { CreateOrderUseCase } from './application/use-cases/create-order.use-case';
import { GetOrderUseCase } from './application/use-cases/get-order.use-case';
import { ListMyOrdersUseCase } from './application/use-cases/list-my-orders.use-case';
import { ListOrdersUseCase } from './application/use-cases/list-orders.use-case';
import { RetryCheckoutUseCase } from './application/use-cases/retry-checkout.use-case';
import { UpdateOrderStatusUseCase } from './application/use-cases/update-order-status.use-case';
import { ProcessPaymentNotificationUseCase } from './application/use-cases/process-payment-notification.use-case';
import { OrdersController } from './infrastructure/http/orders.controller';

@Module({
  imports: [AuthModule, CartModule, NotificationsModule, forwardRef(() => PaymentsModule)],
  controllers: [OrdersController],
  providers: [
    { provide: ORDER_REPOSITORY, useClass: PrismaOrderRepository },
    CreateOrderUseCase,
    GetOrderUseCase,
    ListMyOrdersUseCase,
    ListOrdersUseCase,
    RetryCheckoutUseCase,
    UpdateOrderStatusUseCase,
    ProcessPaymentNotificationUseCase,
  ],
  exports: [ORDER_REPOSITORY, ListOrdersUseCase, UpdateOrderStatusUseCase, ProcessPaymentNotificationUseCase],
})
export class OrdersModule {}
