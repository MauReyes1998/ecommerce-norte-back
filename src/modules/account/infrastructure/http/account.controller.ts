import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '@/shared/auth/current-user';
import { JwtAuthGuard } from '@/shared/auth/jwt-auth.guard';
import { ProductPresenter } from '@/modules/catalog/infrastructure/http/presenters/product.presenter';
import { CreateAddressDto, UpdateAddressDto } from '../../application/dto/address.dto';
import { AddressesUseCases } from '../../application/use-cases/addresses.use-cases';
import { FavoritesUseCases } from '../../application/use-cases/favorites.use-cases';

@ApiTags('Cuenta')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'account', version: '1' })
export class AccountController {
  constructor(
    private readonly addresses: AddressesUseCases,
    private readonly favorites: FavoritesUseCases,
  ) {}

  // ---- Direcciones ----
  @Get('addresses')
  @ApiOperation({ summary: 'Mis direcciones (la predeterminada primero)' })
  listAddresses(@CurrentUser() user: AuthUser) {
    return this.addresses.list(user.id);
  }

  @Post('addresses')
  @ApiOperation({ summary: 'Agregar dirección' })
  createAddress(@CurrentUser() user: AuthUser, @Body() dto: CreateAddressDto) {
    return this.addresses.create(user.id, dto);
  }

  @Patch('addresses/:id')
  @ApiOperation({ summary: 'Editar dirección' })
  updateAddress(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAddressDto) {
    return this.addresses.update(user.id, id, dto);
  }

  @Delete('addresses/:id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Eliminar dirección' })
  removeAddress(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.addresses.remove(user.id, id);
  }

  // ---- Favoritos ----
  @Get('favorites')
  @ApiOperation({ summary: 'Mis favoritos (productos completos)' })
  async listFavorites(@CurrentUser() user: AuthUser) {
    return (await this.favorites.list(user.id)).map(ProductPresenter.summary);
  }

  @Get('favorites/ids')
  @ApiOperation({ summary: 'Solo los ids, para pintar el corazón en el catálogo' })
  favoriteIds(@CurrentUser() user: AuthUser) {
    return this.favorites.ids(user.id);
  }

  @Post('favorites/:slug')
  @ApiOperation({ summary: 'Agregar producto a favoritos (por slug)' })
  addFavorite(@CurrentUser() user: AuthUser, @Param('slug') slug: string) {
    return this.favorites.add(user.id, slug);
  }

  @Delete('favorites/:productId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Quitar de favoritos' })
  removeFavorite(@CurrentUser() user: AuthUser, @Param('productId', ParseUUIDPipe) productId: string) {
    return this.favorites.remove(user.id, productId);
  }
}
