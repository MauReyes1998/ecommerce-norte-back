import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'node:path';
import { randomUUID } from 'node:crypto';

export const UPLOADS_DIR = 'uploads';
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Guarda las imágenes en /uploads con nombre aleatorio; solo acepta jpg, png y webp. */
export const productImageMulterOptions = {
  storage: diskStorage({
    destination: UPLOADS_DIR,
    filename: (_req, file, cb) => cb(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 8 },
  fileFilter: (_req: unknown, file: Express.Multer.File, cb: (e: Error | null, ok: boolean) => void) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      return cb(new BadRequestException('Solo se permiten imágenes JPG, PNG o WebP'), false);
    }
    cb(null, true);
  },
};
