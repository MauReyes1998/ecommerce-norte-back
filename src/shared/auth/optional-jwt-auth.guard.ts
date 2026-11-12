import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Si hay token lo valida y pone req.user; si no hay, deja pasar como invitado (checkout sin cuenta). */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(_err: unknown, user: TUser | false): TUser | null {
    return user || null;
  }
}
