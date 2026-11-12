import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Exige un Bearer token válido. Se combina con RolesGuard para restringir por rol. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(err: unknown, user: TUser | false): TUser {
    if (err || !user) throw new UnauthorizedException('Inicia sesión para continuar');
    return user;
  }
}
