import { Module } from '@nestjs/common';
import { AuthModule } from '@/modules/auth/auth.module';
import { CatalogModule } from '@/modules/catalog/catalog.module';
import { ADDRESS_REPOSITORY, FAVORITE_REPOSITORY } from './domain/account.repository';
import { PrismaAddressRepository, PrismaFavoriteRepository } from './infrastructure/persistence/prisma-account.repositories';
import { AddressesUseCases } from './application/use-cases/addresses.use-cases';
import { FavoritesUseCases } from './application/use-cases/favorites.use-cases';
import { AccountController } from './infrastructure/http/account.controller';

@Module({
  imports: [AuthModule, CatalogModule],
  controllers: [AccountController],
  providers: [
    { provide: ADDRESS_REPOSITORY, useClass: PrismaAddressRepository },
    { provide: FAVORITE_REPOSITORY, useClass: PrismaFavoriteRepository },
    AddressesUseCases,
    FavoritesUseCases,
  ],
})
export class AccountModule {}
