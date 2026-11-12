import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY, UserRepository } from '../../domain/repositories/user.repository';
import { PASSWORD_HASHER, PasswordHasher } from '../../domain/services/password-hasher';
import { hashToken } from './forgot-password.use-case';

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
  ) {}

  async execute(token: string, password: string) {
    const user = await this.users.consumeResetToken(hashToken(token));
    if (!user) throw new BadRequestException('El enlace no es válido o ya venció. Pide uno nuevo.');
    await this.users.updatePassword(user.id, await this.hasher.hash(password));
    return { message: 'Contraseña actualizada. Ya puedes iniciar sesión.' };
  }
}
