import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MAILER } from './domain/mailer';
import { ConsoleMailer } from './infrastructure/console.mailer';
import { SmtpMailer } from './infrastructure/smtp.mailer';
import { OrderNotifier } from './application/order-notifier';

@Global()
@Module({
  providers: [
    {
      provide: MAILER,
      inject: [ConfigService],
      // Con SMTP_HOST configurado manda correos reales; si no, los imprime en consola.
      useFactory: (config: ConfigService) => (config.get('SMTP_HOST') ? new SmtpMailer(config) : new ConsoleMailer()),
    },
    OrderNotifier,
  ],
  exports: [MAILER, OrderNotifier],
})
export class NotificationsModule {}
