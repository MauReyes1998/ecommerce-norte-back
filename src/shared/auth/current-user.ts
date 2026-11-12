import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** Lo que viaja dentro del JWT y lo que recibe cada controlador autenticado. */
export interface AuthUser {
  id: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN';
}

/** @CurrentUser() user: AuthUser */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthUser => {
  return ctx.switchToHttp().getRequest<{ user: AuthUser }>().user;
});
