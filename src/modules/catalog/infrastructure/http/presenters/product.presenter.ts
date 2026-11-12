import { discountPercent, isOnSale, ProductDetail, ProductSummary } from '../../../domain/entities/product.entity';
import { Category } from '../../../domain/entities/category.entity';

/** Da forma a la respuesta pública: agrega oferta y descuento, y oculta campos internos. */
export const ProductPresenter = {
  summary(p: ProductSummary) {
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      gender: p.gender,
      category: p.category,
      price: p.basePrice,
      salePrice: p.salePrice,
      currentPrice: p.currentPrice,
      onSale: isOnSale(p),
      discountPercent: discountPercent(p),
      isFeatured: p.isFeatured,
      isNew: Date.now() - p.createdAt.getTime() < 30 * 24 * 60 * 60 * 1000,
      images: p.images,
      colors: p.colors,
      sizes: p.sizes,
      inStock: p.inStock,
    };
  },

  detail(p: ProductDetail) {
    return {
      ...ProductPresenter.summary(p),
      description: p.description,
      variants: p.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        size: v.size,
        color: v.color,
        colorHex: v.colorHex,
        stock: v.stock,
        price: v.price,
        salePrice: v.salePrice,
        currentPrice: v.salePrice ?? v.price,
        available: v.stock > 0,
      })),
    };
  },
};

export const CategoryPresenter = {
  tree(c: Category): Record<string, unknown> {
    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      imageUrl: c.imageUrl,
      children: c.children.map(CategoryPresenter.tree),
    };
  },
};
