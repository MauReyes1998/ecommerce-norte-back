import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { QuoteCartUseCase } from './application/use-cases/quote-cart.use-case';
import { CartController } from './infrastructure/http/cart.controller';

@Module({
  imports: [CatalogModule],
  controllers: [CartController],
  providers: [QuoteCartUseCase],
  exports: [QuoteCartUseCase],
})
export class CartModule {}
