import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthUser } from '@/shared/auth/current-user';
import { TokenIssuer } from '../../domain/services/token-issuer';

export interface JwtPayload {
  sub: string;
  email: string;
  role: AuthUser['role'];
}

@Injectable()
export class JwtTokenIssuer implements TokenIssuer {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async sign(user: AuthUser) {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    return {
      accessToken: await this.jwt.signAsync(payload),
      expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '7d'),
    };
  }
}
