import { Injectable, Logger } from '@nestjs/common';
import { Mailer, MailMessage } from '../domain/mailer';

/** No manda nada: imprime el correo en la consola. Útil en desarrollo y en pruebas. */
@Injectable()
export class ConsoleMailer implements Mailer {
  private readonly logger = new Logger('Mailer');

  async send(m: MailMessage) {
    this.logger.log(`[correo simulado] Para: ${m.to} · Asunto: ${m.subject}\n${m.text}`);
  }
}
