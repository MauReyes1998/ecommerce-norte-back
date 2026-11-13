import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './shared/prisma/prisma.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { AuthModule } from './modules/auth/auth.module';
import { CartModule } from './modules/cart/cart.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AccountModule } from './modules/account/account.module';
import { AdminModule } from './modules/admin/admin.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { StockAlertsModule } from './modules/stock-alerts/stock-alerts.module';
import { ReviewsModule } from './modules/reviews/reviews.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    PrismaModule,
    // Límite global: 120 peticiones por minuto por IP (auth y webhook tienen su propio límite).
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    NotificationsModule,
    CatalogModule,
    AuthModule,
    CouponsModule,
    CartModule,
    OrdersModule,
    PaymentsModule,
    AccountModule,
    StockAlertsModule,
    ReviewsModule,
    AdminModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
