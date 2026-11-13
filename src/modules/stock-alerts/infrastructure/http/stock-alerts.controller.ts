import { BadRequestException, Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthUser, CurrentUser } from '@/shared/auth/current-user';
import { OptionalJwtAuthGuard } from '@/shared/auth/optional-jwt-auth.guard';
import { CreateStockAlertDto } from '../../application/dto/stock-alert.dto';
import { StockAlertsUseCases } from '../../application/stock-alerts.use-cases';

@ApiTags('Catálogo')
@Controller({ path: 'products/:slug/stock-alerts', version: '1' })
export class StockAlertsController {
  constructor(private readonly alerts: StockAlertsUseCases) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Avísame cuando haya stock de esta talla (cliente o invitado con correo)' })
  subscribe(@Param('slug') slug: string, @Body() dto: CreateStockAlertDto, @CurrentUser() user: AuthUser | null) {
    const email = user?.email ?? dto.email;
    if (!email) throw new BadRequestException('Indica un correo para avisarte');
    return this.alerts.subscribe(slug, dto.variantId, email);
  }
}
