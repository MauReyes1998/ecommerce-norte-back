import { Inject, Injectable } from '@nestjs/common';
import { UpdateProfileDto } from '../dto/auth.dto';
import { USER_REPOSITORY, UserRepository } from '../../domain/repositories/user.repository';

@Injectable()
export class UpdateProfileUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepository) {}

  execute(userId: string, dto: UpdateProfileDto) {
    return this.users.updateProfile(userId, dto);
  }
}
