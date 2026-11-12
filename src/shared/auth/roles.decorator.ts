import { SetMetadata } from '@nestjs/common';
import { AuthUser } from './current-user';

export const ROLES_KEY = 'roles';

/** @Roles('ADMIN') sobre un controlador o un handler. Se usa junto con JwtAuthGuard. */
export const Roles = (...roles: AuthUser['role'][]) => SetMetadata(ROLES_KEY, roles);
