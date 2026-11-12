import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from '../dto/auth.dto';
import { USER_REPOSITORY, UserRepository } from '../../domain/repositories/user.repository';
import { PASSWORD_HASHER, PasswordHasher } from '../../domain/services/password-hasher';
import { TOKEN_ISSUER, TokenIssuer } from '../../domain/services/token-issuer';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    @Inject(TOKEN_ISSUER) private readonly tokens: TokenIssuer,
  ) {}

  async execute(dto: LoginDto) {
    const user = await this.users.findByEmail(dto.email);
    // Mismo mensaje si el correo no existe o la contraseña falla: no revelar cuál.
    const valid = user ? await this.hasher.compare(dto.password, user.passwordHash) : false;
    if (!user || !valid) throw new UnauthorizedException('Correo o contraseña incorrectos');

    const token = await this.tokens.sign({ id: user.id, email: user.email, role: user.role });
    return { user, token };
  }
}
