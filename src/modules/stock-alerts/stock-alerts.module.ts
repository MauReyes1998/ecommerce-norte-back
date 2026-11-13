import { Module } from '@nestjs/common';
import { AuthModule } from '@/modules/auth/auth.module';
import { STOCK_ALERT_REPOSITORY } from './domain/stock-alert.repository';
import { PrismaStockAlertRepository } from './infrastructure/persistence/prisma-stock-alert.repository';
import { StockAlertsUseCases } from './application/stock-alerts.use-cases';
import { StockAlertsController } from './infrastructure/http/stock-alerts.controller';

@Module({
  imports: [AuthModule],
  controllers: [StockAlertsController],
  providers: [{ provide: STOCK_ALERT_REPOSITORY, useClass: PrismaStockAlertRepository }, StockAlertsUseCases],
  // El admin lo llama cuando cambia inventario.
  exports: [StockAlertsUseCases],
})
export class StockAlertsModule {}
