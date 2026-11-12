import { User } from '../../domain/entities/user.entity';

/** Nunca expone passwordHash. */
export const UserPresenter = {
  profile(u: User) {
    return { id: u.id, email: u.email, name: u.name, phone: u.phone, role: u.role, createdAt: u.createdAt };
  },
  session(result: { user: User; token: { accessToken: string; expiresIn: string } }) {
    return { user: UserPresenter.profile(result.user), ...result.token };
  },
};
