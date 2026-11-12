import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { NewUser, User } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  create(data: NewUser): Promise<User> {
    return this.prisma.user.create({ data });
  }

  updateProfile(id: string, data: Partial<Pick<User, 'name' | 'phone'>>): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await this.prisma.user.update({ where: { id }, data: { passwordHash } });
  }

  async createResetToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.passwordResetToken.updateMany({ where: { userId, usedAt: null }, data: { usedAt: new Date() } }),
      this.prisma.passwordResetToken.create({ data: { userId, tokenHash, expiresAt } }),
    ]);
  }

  async consumeResetToken(tokenHash: string): Promise<User | null> {
    const t = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash }, include: { user: true } });
    if (!t || t.usedAt || t.expiresAt < new Date()) return null;
    await this.prisma.passwordResetToken.update({ where: { id: t.id }, data: { usedAt: new Date() } });
    return t.user;
  }
}
