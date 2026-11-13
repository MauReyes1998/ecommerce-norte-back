import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/shared/auth/jwt-auth.guard';
import { Roles } from '@/shared/auth/roles.decorator';
import { RolesGuard } from '@/shared/auth/roles.guard';
import { CouponsUseCases } from '../../application/coupons.use-cases';
import { CreateCouponDto, UpdateCouponDto } from '../../application/dto/coupon.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller({ path: 'admin/coupons', version: '1' })
export class AdminCouponsController {
  constructor(private readonly coupons: CouponsUseCases) {}

  @Get()
  @ApiOperation({ summary: 'Todos los cupones con su contador de usos' })
  list() {
    return this.coupons.list();
  }

  @Post()
  @ApiOperation({ summary: 'Crear cupón (porcentaje, monto fijo o envío gratis)' })
  create(@Body() dto: CreateCouponDto) {
    return this.coupons.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar cupón; para pausarlo manda isActive=false' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCouponDto) {
    return this.coupons.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Eliminar cupón (los pedidos conservan el código usado)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.coupons.remove(id);
  }
}
