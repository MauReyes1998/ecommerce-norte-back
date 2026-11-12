import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';

/**
 * Todas las respuestas exitosas salen como { data, meta? }.
 * Si el controlador ya regresa { data, meta } (por ejemplo, listas paginadas) se respeta.
 */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((result) => {
        if (result && typeof result === 'object' && 'data' in result) return result;
        return { data: result ?? null };
      }),
    );
  }
}
