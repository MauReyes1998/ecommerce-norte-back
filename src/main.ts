import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { setupApp } from './setup-app';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Imágenes subidas desde el panel admin.
  const uploads = join(process.cwd(), 'uploads');
  mkdirSync(uploads, { recursive: true });
  app.useStaticAssets(uploads, { prefix: '/uploads/' });
  const config = app.get(ConfigService);
  // Cabeceras de seguridad. crossOriginResourcePolicy en cross-origin para que el front pueda cargar /uploads.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  setupApp(app, config.get<string>('CORS_ORIGINS'));

  const swagger = new DocumentBuilder()
    .setTitle('NORTE API')
    .setDescription('API de la tienda de ropa NORTE')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swagger));

  const port = config.get<number>('PORT', 3000);
  await app.listen(port);
  Logger.log(`API en http://localhost:${port}/api/v1 · Docs en http://localhost:${port}/api/docs`, 'Bootstrap');
}

void bootstrap();
