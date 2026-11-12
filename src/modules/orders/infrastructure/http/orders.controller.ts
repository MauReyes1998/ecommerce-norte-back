import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '@/shared/auth/current-user';
import { JwtAuthGuard } from '@/shared/auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '@/shared/auth/optional-jwt-auth.guard';
import { PaginationQuery, toPageResponse } from '@/shared/pagination/pagination';
import { CreateOrderDto } from '../../application/dto/order.dto';
import { CreateOrderUseCase } from '../../application/use-cases/create-order.use-case';
import { GetOrderUseCase } from '../../application/use-cases/get-order.use-case';
import { ListMyOrdersUseCase } from '../../application/use-cases/list-my-orders.use-case';
import { RetryCheckoutUseCase } from '../../application/use-cases/retry-checkout.use-case';
import { OrderPresenter } from './order.presenter';

@ApiTags('Pedidos')
@Controller({ path: 'orders', version: '1' })
export class OrdersController {
  constructor(
    private readonly createOrder: CreateOrderUseCase,
    private readonly getOrder: GetOrderUseCase,
    private readonly listMyOrders: ListMyOrdersUseCase,
    private readonly retryCheckout: RetryCheckoutUseCase,
  ) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crea el pedido (cliente o invitado) y regresa el link de pago de Mercado Pago' })
  async create(@Body() dto: CreateOrderDto, @CurrentUser() user: AuthUser | null) {
    const { order, checkoutUrl } = await this.createOrder.execute(dto, user);
    return { order: OrderPresenter.full(order), checkoutUrl };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Historial de pedidos del usuario' })
  async mine(@CurrentUser() user: AuthUser, @Query() query: PaginationQuery) {
    const page = await this.listMyOrders.execute(user.id, query.page, query.limit);
    return toPageResponse(page, OrderPresenter.summary);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detalle de un pedido (dueño, invitado con el id, o admin)' })
  async detail(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser | null) {
    return OrderPresenter.full(await this.getOrder.execute(id, user));
  }

  @Post(':id/checkout')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vuelve a generar el link de pago de un pedido pendiente' })
  retry(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser | null) {
    return this.retryCheckout.execute(id, user);
  }
}
