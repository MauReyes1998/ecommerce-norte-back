import { NewUser, User } from '../entities/user.entity';

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(data: NewUser): Promise<User>;
  updateProfile(id: string, data: Partial<Pick<User, 'name' | 'phone'>>): Promise<User>;
  updatePassword(id: string, passwordHash: string): Promise<void>;
  /** Guarda el hash del token de recuperación; invalida los anteriores del usuario. */
  createResetToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void>;
  /** Regresa el usuario si el token existe, no se ha usado y no ha vencido; lo marca como usado. */
  consumeResetToken(tokenHash: string): Promise<User | null>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
