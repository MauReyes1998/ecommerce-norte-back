import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { RolesGuard } from '@/shared/auth/roles.guard';
import { USER_REPOSITORY } from './domain/repositories/user.repository';
import { PASSWORD_HASHER } from './domain/services/password-hasher';
import { TOKEN_ISSUER } from './domain/services/token-issuer';
import { PrismaUserRepository } from './infrastructure/persistence/prisma-user.repository';
import { BcryptPasswordHasher } from './infrastructure/security/bcrypt-password-hasher';
import { JwtTokenIssuer } from './infrastructure/security/jwt-token-issuer';
import { JwtStrategy } from './infrastructure/security/jwt.strategy';
import { RegisterUseCase } from './application/use-cases/register.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { GetProfileUseCase } from './application/use-cases/get-profile.use-case';
import { UpdateProfileUseCase } from './application/use-cases/update-profile.use-case';
import { ForgotPasswordUseCase } from './application/use-cases/forgot-password.use-case';
import { ResetPasswordUseCase } from './application/use-cases/reset-password.use-case';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthController } from './infrastructure/http/auth.controller';

@Module({
  imports: [
    NotificationsModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN', '7d') as JwtSignOptions['expiresIn'] },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: TOKEN_ISSUER, useClass: JwtTokenIssuer },
    JwtStrategy,
    RolesGuard,
    RegisterUseCase,
    LoginUseCase,
    GetProfileUseCase,
    UpdateProfileUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
  ],
  // PassportModule y JwtModule se exportan para que otros módulos usen JwtAuthGuard y RolesGuard.
  exports: [USER_REPOSITORY, PassportModule, JwtModule, RolesGuard],
})
export class AuthModule {}
