import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

export interface ErrorBody {
  error: {
    statusCode: number;
    code: string;
    message: string;
    details?: unknown;
    path: string;
    timestamp: string;
  };
}

/** Convierte cualquier error en una respuesta JSON con la misma forma. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const { statusCode, code, message, details } = this.resolve(exception);
    if (statusCode >= 500) {
      this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    }

    const body: ErrorBody = {
      error: { statusCode, code, message, details, path: req.url, timestamp: new Date().toISOString() },
    };
    res.status(statusCode).json(body);
  }

  private resolve(exception: unknown) {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const response = exception.getResponse();
      const raw = typeof response === 'string' ? { message: response } : (response as Record<string, unknown>);
      const isValidation = Array.isArray(raw.message);
      return {
        statusCode,
        code: isValidation ? 'VALIDATION_ERROR' : HttpStatus[statusCode] ?? 'ERROR',
        message: isValidation ? 'Datos inválidos' : String(raw.message ?? exception.message),
        details: isValidation ? raw.message : undefined,
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        return { statusCode: 409, code: 'CONFLICT', message: 'El registro ya existe', details: exception.meta };
      }
      if (exception.code === 'P2025') {
        return { statusCode: 404, code: 'NOT_FOUND', message: 'Registro no encontrado', details: undefined };
      }
    }

    return { statusCode: 500, code: 'INTERNAL_ERROR', message: 'Error interno del servidor', details: undefined };
  }
}
