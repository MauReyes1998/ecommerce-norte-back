import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { AllExceptionsFilter } from './shared/http/all-exceptions.filter';
import { ResponseInterceptor } from './shared/http/response.interceptor';

/** Configuración común para la app real y para las pruebas e2e. */
export function setupApp(app: INestApplication, corsOrigins?: string) {
  // sitemap.xml va en la raíz para que el front lo exponga como /sitemap.xml (ver SitemapController).
  app.setGlobalPrefix('api', { exclude: ['sitemap.xml'] });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.enableCors({
    origin: corsOrigins ? corsOrigins.split(',').map((o) => o.trim()) : true,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());
}
