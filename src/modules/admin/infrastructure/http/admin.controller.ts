import {
  Body, Controller, Delete, Get, Header, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, UploadedFiles, UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthUser, CurrentUser } from '@/shared/auth/current-user';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/shared/auth/jwt-auth.guard';
import { Roles } from '@/shared/auth/roles.decorator';
import { RolesGuard } from '@/shared/auth/roles.guard';
import { toPageResponse } from '@/shared/pagination/pagination';
import { ListOrdersQuery } from '@/modules/orders/application/dto/order.dto';
import { ListOrdersUseCase } from '@/modules/orders/application/use-cases/list-orders.use-case';
import { UpdateOrderStatusUseCase } from '@/modules/orders/application/use-cases/update-order-status.use-case';
import { OrderPresenter } from '@/modules/orders/infrastructure/http/order.presenter';
import {
  AdminOrderStatusDto, BulkProductsDto, CreateCategoryDto, CreateProductDto, DashboardQuery, ListAdminProductsQuery,
  ListCustomersQuery, ReorderImagesDto, UpdateAdminOrderDto, UpdateCategoryDto, UpdateProductDto, VariantStockDto,
} from '../../application/dto/admin.dto';
import { AdminOrdersUseCases } from '../../application/use-cases/admin-orders.use-cases';
import { AdminProductsUseCases } from '../../application/use-cases/admin-products.use-cases';
import { AdminCategoriesUseCases } from '../../application/use-cases/admin-categories.use-cases';
import { DashboardUseCase } from '../../application/use-cases/dashboard.use-case';
import { productImageMulterOptions, UPLOADS_DIR } from './upload.config';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller({ path: 'admin', version: '1' })
export class AdminController {
  constructor(
    private readonly products: AdminProductsUseCases,
    private readonly categories: AdminCategoriesUseCases,
    private readonly dashboard: DashboardUseCase,
    private readonly listOrders: ListOrdersUseCase,
    private readonly updateOrderStatus: UpdateOrderStatusUseCase,
    private readonly adminOrders: AdminOrdersUseCases,
  ) {}

  // ---- Dashboard ----
  @Get('dashboard')
  @ApiOperation({ summary: 'KPIs del rango (7/30/90 días), más vendidos, categorías, stock bajo y ventas por día' })
  stats(@Query() q: DashboardQuery) {
    return this.dashboard.execute(q.range);
  }

  // ---- Productos ----
  @Get('products')
  @ApiOperation({ summary: 'Productos (incluye inactivos) con búsqueda y filtros' })
  async listProducts(@Query() query: ListAdminProductsQuery) {
    return toPageResponse(await this.products.list(query), (p) => p);
  }

  @Patch('products/bulk')
  @ApiOperation({ summary: 'Activar/desactivar o destacar varios productos a la vez' })
  bulkProducts(@Body() dto: BulkProductsDto) {
    return this.products.bulk(dto.ids, { isActive: dto.isActive, isFeatured: dto.isFeatured });
  }

  @Post('products/:id/duplicate')
  @ApiOperation({ summary: 'Duplicar producto (nace inactivo, con stock 0)' })
  duplicateProduct(@Param('id', ParseUUIDPipe) id: string) {
    return this.products.duplicate(id);
  }

  @Patch('variants/:variantId/stock')
  @ApiOperation({ summary: 'Ajuste rápido de stock de una variante' })
  setStock(@Param('variantId', ParseUUIDPipe) variantId: string, @Body() dto: VariantStockDto) {
    return this.products.setVariantStock(variantId, dto.stock);
  }

  @Get('products/:id')
  getProduct(@Param('id', ParseUUIDPipe) id: string) {
    return this.products.get(id);
  }

  @Post('products')
  @ApiOperation({ summary: 'Crear producto con sus variantes' })
  createProduct(@Body() dto: CreateProductDto) {
    return this.products.create(dto);
  }

  @Patch('products/:id')
  @ApiOperation({ summary: 'Editar producto; si mandas variants, se sincronizan (las que falten se desactivan)' })
  updateProduct(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProductDto) {
    return this.products.update(id, dto);
  }

  @Delete('products/:id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Desactivar producto (no se borra: puede estar en pedidos)' })
  deactivateProduct(@Param('id', ParseUUIDPipe) id: string) {
    return this.products.deactivate(id);
  }

  @Post('products/:id/images')
  @UseInterceptors(FilesInterceptor('images', 8, productImageMulterOptions))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { images: { type: 'array', items: { type: 'string', format: 'binary' } } } } })
  @ApiOperation({ summary: 'Subir hasta 8 imágenes (jpg, png, webp, máx. 5 MB c/u)' })
  async uploadImages(@Param('id', ParseUUIDPipe) id: string, @UploadedFiles() files: Express.Multer.File[] = []) {
    const product = await this.products.get(id);
    return this.products.addImages(
      id,
      files.map((f, i) => ({ url: `/${UPLOADS_DIR}/${f.filename}`, alt: `${product.name} - foto ${product.images.length + i + 1}` })),
    );
  }

  @Patch('products/:id/images/order')
  @ApiOperation({ summary: 'Reordenar imágenes (la primera es la principal)' })
  reorderImages(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ReorderImagesDto) {
    return this.products.reorderImages(id, dto.imageIds);
  }

  @Delete('products/:id/images/:imageId')
  removeImage(@Param('id', ParseUUIDPipe) id: string, @Param('imageId', ParseUUIDPipe) imageId: string) {
    return this.products.removeImage(id, imageId);
  }

  // ---- Categorías ----
  @Get('categories')
  listCategories() {
    return this.categories.list();
  }

  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.categories.create(dto);
  }

  @Patch('categories/:id')
  updateCategory(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCategoryDto) {
    return this.categories.update(id, dto);
  }

  @Delete('categories/:id')
  @HttpCode(204)
  removeCategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.categories.remove(id);
  }

  // ---- Pedidos ----
  @Get('orders')
  @ApiOperation({ summary: 'Todos los pedidos, filtrables por estatus y búsqueda' })
  async orders(@Query() query: ListOrdersQuery) {
    return toPageResponse(await this.listOrders.execute(query), OrderPresenter.summary);
  }

  @Get('orders/export.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="pedidos.csv"')
  @ApiOperation({ summary: 'Exportar pedidos filtrados a CSV (hasta 1000)' })
  async exportOrders(@Query() query: ListOrdersQuery) {
    const page = await this.listOrders.execute({ ...query, page: 1, limit: 1000 });
    return this.adminOrders.toCsv(page);
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Detalle con historial, guía y nota interna' })
  async getOrder(@Param('id', ParseUUIDPipe) id: string) {
    return OrderPresenter.admin(await this.adminOrders.get(id));
  }

  @Patch('orders/:id')
  @ApiOperation({ summary: 'Guía de envío y nota interna' })
  async updateOrder(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAdminOrderDto) {
    return OrderPresenter.admin(await this.adminOrders.updateFields(id, dto));
  }

  @Patch('orders/:id/status')
  @ApiOperation({ summary: 'Cambiar estatus (PENDIENTE→PAGADO/CANCELADO, PAGADO→ENVIADO/CANCELADO, ENVIADO→ENTREGADO)' })
  async setStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AdminOrderStatusDto, @CurrentUser() user: AuthUser) {
    return OrderPresenter.admin(await this.updateOrderStatus.execute(id, dto.status, user.email, dto.note));
  }

  // ---- Clientes ----
  @Get('customers')
  @ApiOperation({ summary: 'Clientes con número de pedidos y total gastado' })
  async customers(@Query() q: ListCustomersQuery) {
    return toPageResponse(await this.adminOrders.listCustomers(q.search, q.page, q.limit), (c) => c);
  }
}
