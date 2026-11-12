export type Role = 'CUSTOMER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: Role;
  passwordHash: string;
  createdAt: Date;
}

export type NewUser = Pick<User, 'email' | 'name' | 'phone' | 'passwordHash'>;
