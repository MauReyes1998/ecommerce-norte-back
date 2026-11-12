import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'node:crypto';
import { MAILER, Mailer } from '@/modules/notifications/domain/mailer';
import { USER_REPOSITORY, UserRepository } from '../../domain/repositories/user.repository';

export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

/** Siempre responde igual, exista o no el correo, para no revelar qué cuentas hay. */
@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(MAILER) private readonly mailer: Mailer,
    private readonly config: ConfigService,
  ) {}

  async execute(email: string) {
    const user = await this.users.findByEmail(email);
    if (user) {
      const token = randomBytes(32).toString('base64url');
      await this.users.createResetToken(user.id, hashToken(token), new Date(Date.now() + 60 * 60 * 1000));
      const url = `${this.config.get('FRONTEND_URL', 'http://localhost:5173').replace(/\/$/, '')}/cuenta/restablecer?token=${token}`;
      void this.mailer.send({
        to: user.email,
        subject: 'Restablece tu contraseña de NORTE',
        text: `Hola ${user.name}. Para crear una contraseña nueva entra aquí (vence en 1 hora): ${url}\nSi no lo pediste, ignora este correo.`,
        html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#111"><p style="font-size:22px;letter-spacing:.2em;font-weight:900">NORTE</p><p>Hola ${user.name},</p><p>Para crear una contraseña nueva da clic en el botón. El enlace vence en 1 hora.</p><p><a href="${url}" style="background:#111;color:#fff;padding:12px 20px;text-decoration:none;display:inline-block">Restablecer contraseña</a></p><p style="color:#777;font-size:12px">Si no lo pediste, ignora este correo.</p></div>`,
      });
    }
    return { message: 'Si el correo está registrado, te enviamos las instrucciones.' };
  }
}
