import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import { Mailer, MailMessage } from '../domain/mailer';

/** Envío real por SMTP (Gmail, Brevo, Mailgun, etc.). Nunca lanza: un correo fallido no debe tumbar un pedido. */
@Injectable()
export class SmtpMailer implements Mailer {
  private readonly logger = new Logger('Mailer');
  private readonly transport: Transporter;
  private readonly from: string;

  constructor(config: ConfigService) {
    this.transport = createTransport({
      host: config.getOrThrow<string>('SMTP_HOST'),
      port: Number(config.get('SMTP_PORT', 587)),
      secure: Number(config.get('SMTP_PORT', 587)) === 465,
      auth: { user: config.getOrThrow<string>('SMTP_USER'), pass: config.getOrThrow<string>('SMTP_PASS') },
    });
    this.from = config.get<string>('MAIL_FROM', 'NORTE <no-reply@norte.mx>');
  }

  async send(m: MailMessage) {
    try {
      await this.transport.sendMail({ from: this.from, to: m.to, subject: m.subject, html: m.html, text: m.text });
    } catch (e) {
      this.logger.error(`No se pudo enviar "${m.subject}" a ${m.to}: ${String(e)}`);
    }
  }
}
