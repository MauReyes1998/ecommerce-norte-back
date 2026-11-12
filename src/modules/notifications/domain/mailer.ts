export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/** Puerto de envío de correo. En local se usa ConsoleMailer; con SMTP_* en .env, SmtpMailer. */
export interface Mailer {
  send(message: MailMessage): Promise<void>;
}

export const MAILER = Symbol('MAILER');
