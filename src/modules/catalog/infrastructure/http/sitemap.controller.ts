import { Controller, Get, Inject, Res, VERSION_NEUTRAL } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Response } from 'express';
import { Category } from '../../domain/entities/category.entity';
import { PRODUCT_REPOSITORY, ProductRepository } from '../../domain/repositories/product.repository';
import { ListCategoriesUseCase } from '../../application/use-cases/list-categories.use-case';

const XML_ESCAPES: Record<string, string> = { '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' };
const escapeXml = (s: string) => s.replace(/[<>&'"]/g, (c) => XML_ESCAPES[c]);
const flatten = (nodes: Category[]): string[] => nodes.flatMap((c) => [c.slug, ...flatten(c.children)]);

/**
 * /sitemap.xml para Google: inicio, tienda, categorías y productos activos.
 * Vive fuera de /api/v1 (ver setupApp) y responde XML directo con @Res para
 * saltarse el ResponseInterceptor, que envuelve todo en { data }.
 */
@ApiExcludeController()
@Controller({ path: 'sitemap.xml', version: VERSION_NEUTRAL })
export class SitemapController {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
    private readonly categories: ListCategoriesUseCase,
    private readonly config: ConfigService,
  ) {}

  @Get()
  async sitemap(@Res() res: Response) {
    const base = this.config.get<string>('FRONTEND_URL', 'http://localhost:5173').replace(/\/$/, '');
    const [products, tree] = await Promise.all([this.products.findSitemapEntries(), this.categories.execute()]);
    const today = new Date().toISOString().slice(0, 10);

    const urls = [
      { loc: '/', lastmod: today, priority: '1.0' },
      { loc: '/tienda', lastmod: today, priority: '0.9' },
      ...flatten(tree).map((slug) => ({ loc: `/tienda/${slug}`, lastmod: today, priority: '0.8' })),
      ...products.map((p) => ({ loc: `/producto/${p.slug}`, lastmod: p.updatedAt.toISOString().slice(0, 10), priority: '0.7' })),
    ];

    const xml =
      '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      urls.map((u) => `  <url><loc>${escapeXml(base + u.loc)}</loc><lastmod>${u.lastmod}</lastmod><priority>${u.priority}</priority></url>`).join('\n') +
      '\n</urlset>\n';

    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.type('application/xml').send(xml);
  }
}
