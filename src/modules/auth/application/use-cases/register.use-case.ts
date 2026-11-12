import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { RegisterDto } from '../dto/auth.dto';
import { USER_REPOSITORY, UserRepository } from '../../domain/repositories/user.repository';
import { PASSWORD_HASHER, PasswordHasher } from '../../domain/services/password-hasher';
import { TOKEN_ISSUER, TokenIssuer } from '../../domain/services/token-issuer';

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    @Inject(TOKEN_ISSUER) private readonly tokens: TokenIssuer,
  ) {}

  async execute(dto: RegisterDto) {
    if (await this.users.findByEmail(dto.email)) {
      throw new ConflictException('Ya existe una cuenta con ese correo');
    }
    const user = await this.users.create({
      email: dto.email,
      name: dto.name,
      phone: dto.phone ?? null,
      passwordHash: await this.hasher.hash(dto.password),
    });
    const token = await this.tokens.sign({ id: user.id, email: user.email, role: user.role });
    return { user, token };
  }
}
