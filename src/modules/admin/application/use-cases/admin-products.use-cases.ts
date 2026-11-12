import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { slugify } from '@/shared/utils/slug';
import { CreateProductDto, ListAdminProductsQuery, UpdateProductDto } from '../dto/admin.dto';
import { ADMIN_PRODUCT_REPOSITORY, AdminProductRepository } from '../../domain/admin.repository';

@Injectable()
export class AdminProductsUseCases {
  constructor(@Inject(ADMIN_PRODUCT_REPOSITORY) private readonly products: AdminProductRepository) {}

  list(query: ListAdminProductsQuery) {
    const { page, limit, ...filters } = query;
    return this.products.findMany(filters, page, limit);
  }

  async get(id: string) {
    const product = await this.products.findById(id);
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  async create(dto: CreateProductDto) {
    this.assertPrices(dto.basePrice, dto.salePrice ?? null);
    this.assertUniqueVariants(dto.variants);
    const slug = dto.slug ?? slugify(dto.name);
    if (await this.products.slugExists(slug)) throw new ConflictException(`Ya existe un producto con el slug "${slug}"`);
    const { variants, ...rest } = dto;
    return this.products.create(
      { ...rest, slug, salePrice: dto.salePrice ?? null, isFeatured: dto.isFeatured ?? false, isActive: dto.isActive ?? true },
      variants,
    );
  }

  bulk(ids: string[], data: { isActive?: boolean; isFeatured?: boolean }) {
    if (data.isActive === undefined && data.isFeatured === undefined) throw new BadRequestException('Indica isActive o isFeatured');
    return this.products.bulkUpdate(ids, data).then((updated) => ({ updated }));
  }

  async duplicate(id: string) {
    const src = await this.get(id);
    let slug = `${src.slug}-copia`;
    for (let n = 2; await this.products.slugExists(slug); n++) slug = `${src.slug}-copia-${n}`;
    return this.products.duplicate(id, `${src.name} (copia)`, slug);
  }

  setVariantStock(variantId: string, stock: number) {
    return this.products.setVariantStock(variantId, stock);
  }

  async update(id: string, dto: UpdateProductDto) {
    const current = await this.get(id);
    const basePrice = dto.basePrice ?? current.basePrice;
    const salePrice = dto.salePrice === undefined ? current.salePrice : dto.salePrice;
    this.assertPrices(basePrice, salePrice);
    if (dto.variants) this.assertUniqueVariants(dto.variants);
    if (dto.slug && dto.slug !== current.slug && (await this.products.slugExists(dto.slug, id))) {
      throw new ConflictException(`Ya existe un producto con el slug "${dto.slug}"`);
    }
    const { variants, ...rest } = dto;
    return this.products.update(id, { ...rest, salePrice }, variants);
  }

  async deactivate(id: string) {
    await this.get(id);
    await this.products.deactivate(id);
  }

  async addImages(id: string, files: { url: string; alt: string }[]) {
    await this.get(id);
    if (files.length === 0) throw new BadRequestException('Sube al menos una imagen');
    return this.products.addImages(id, files);
  }

  async removeImage(id: string, imageId: string) {
    await this.get(id);
    return this.products.removeImage(id, imageId);
  }

  async reorderImages(id: string, imageIds: string[]) {
    await this.get(id);
    return this.products.reorderImages(id, imageIds);
  }

  private assertPrices(base: number, sale: number | null) {
    if (sale !== null && sale >= base) throw new BadRequestException('El precio de oferta debe ser menor al precio base');
  }

  private assertUniqueVariants(variants: { sku: string; size: string; color: string }[]) {
    const skus = new Set<string>();
    const combos = new Set<string>();
    for (const v of variants) {
      if (skus.has(v.sku)) throw new BadRequestException(`SKU repetido: ${v.sku}`);
      const combo = `${v.size}|${v.color.toLowerCase()}`;
      if (combos.has(combo)) throw new BadRequestException(`Variante repetida: ${v.size} / ${v.color}`);
      skus.add(v.sku);
      combos.add(combo);
    }
  }
}
