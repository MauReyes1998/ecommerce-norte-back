import { AuthUser } from '@/shared/auth/current-user';

export interface TokenIssuer {
  sign(user: AuthUser): Promise<{ accessToken: string; expiresIn: string }>;
}

export const TOKEN_ISSUER = Symbol('TOKEN_ISSUER');
