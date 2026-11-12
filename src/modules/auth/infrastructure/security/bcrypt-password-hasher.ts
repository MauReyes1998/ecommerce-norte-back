import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PasswordHasher } from '../../domain/services/password-hasher';

@Injectable()
export class BcryptPasswordHasher implements PasswordHasher {
  private readonly rounds = 10;

  hash(plain: string) {
    return bcrypt.hash(plain, this.rounds);
  }

  compare(plain: string, hash: string) {
    return bcrypt.compare(plain, hash);
  }
}
