import { Module } from '@nestjs/common';
import { AuthModule } from '@/modules/auth/auth.module';
import { OrdersModule } from '@/modules/orders/orders.module';
import { ADMIN_CATEGORY_REPOSITORY, ADMIN_CUSTOMER_REPOSITORY, ADMIN_PRODUCT_REPOSITORY, DASHBOARD_REPOSITORY } from './domain/admin.repository';
import {
  PrismaAdminCategoryRepository, PrismaAdminCustomerRepository, PrismaAdminProductRepository, PrismaDashboardRepository,
} from './infrastructure/persistence/prisma-admin.repositories';
import { AdminProductsUseCases } from './application/use-cases/admin-products.use-cases';
import { AdminCategoriesUseCases } from './application/use-cases/admin-categories.use-cases';
import { DashboardUseCase } from './application/use-cases/dashboard.use-case';
import { AdminOrdersUseCases } from './application/use-cases/admin-orders.use-cases';
import { AdminController } from './infrastructure/http/admin.controller';

@Module({
  imports: [AuthModule, OrdersModule],
  controllers: [AdminController],
  providers: [
    { provide: ADMIN_PRODUCT_REPOSITORY, useClass: PrismaAdminProductRepository },
    { provide: ADMIN_CATEGORY_REPOSITORY, useClass: PrismaAdminCategoryRepository },
    { provide: DASHBOARD_REPOSITORY, useClass: PrismaDashboardRepository },
    { provide: ADMIN_CUSTOMER_REPOSITORY, useClass: PrismaAdminCustomerRepository },
    AdminProductsUseCases,
    AdminCategoriesUseCases,
    DashboardUseCase,
    AdminOrdersUseCases,
  ],
})
export class AdminModule {}
