import { Body, Controller, Get, HttpCode, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthUser, CurrentUser } from '@/shared/auth/current-user';
import { JwtAuthGuard } from '@/shared/auth/jwt-auth.guard';
import { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto, UpdateProfileDto } from '../../application/dto/auth.dto';
import { ForgotPasswordUseCase } from '../../application/use-cases/forgot-password.use-case';
import { ResetPasswordUseCase } from '../../application/use-cases/reset-password.use-case';
import { RegisterUseCase } from '../../application/use-cases/register.use-case';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { GetProfileUseCase } from '../../application/use-cases/get-profile.use-case';
import { UpdateProfileUseCase } from '../../application/use-cases/update-profile.use-case';
import { UserPresenter } from './user.presenter';

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly register: RegisterUseCase,
    private readonly login: LoginUseCase,
    private readonly getProfile: GetProfileUseCase,
    private readonly updateProfile: UpdateProfileUseCase,
    private readonly forgotPassword: ForgotPasswordUseCase,
    private readonly resetPassword: ResetPasswordUseCase,
  ) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Crear cuenta de cliente; regresa el token' })
  async registerHandler(@Body() dto: RegisterDto) {
    return UserPresenter.session(await this.register.execute(dto));
  }

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(200)
  @ApiOperation({ summary: 'Iniciar sesión; regresa el token' })
  async loginHandler(@Body() dto: LoginDto) {
    return UserPresenter.session(await this.login.execute(dto));
  }

  @Post('forgot-password')
  @HttpCode(200)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @ApiOperation({ summary: 'Envía un correo con el enlace para restablecer la contraseña' })
  forgot(@Body() dto: ForgotPasswordDto) {
    return this.forgotPassword.execute(dto.email);
  }

  @Post('reset-password')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Cambia la contraseña con el token del correo' })
  reset(@Body() dto: ResetPasswordDto) {
    return this.resetPassword.execute(dto.token, dto.password);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Perfil del usuario autenticado' })
  async me(@CurrentUser() user: AuthUser) {
    return UserPresenter.profile(await this.getProfile.execute(user.id));
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar nombre o teléfono' })
  async updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return UserPresenter.profile(await this.updateProfile.execute(user.id, dto));
  }
}
