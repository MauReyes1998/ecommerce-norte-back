import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MAILER, Mailer } from '@/modules/notifications/domain/mailer';
import { STOCK_ALERT_REPOSITORY, StockAlertRepository } from '../domain/stock-alert.repository';
import { StockMail } from './stock-mail.templates';

/** "Avísame cuando haya stock": suscripción por correo y aviso cuando la variante vuelve a tener piezas. */
@Injectable()
export class StockAlertsUseCases {
  private readonly logger = new Logger(StockAlertsUseCases.name);
  private readonly frontend: string;

  constructor(
    @Inject(STOCK_ALERT_REPOSITORY) private readonly alerts: StockAlertRepository,
    @Inject(MAILER) private readonly mailer: Mailer,
    config: ConfigService,
  ) {
    this.frontend = config.get<string>('FRONTEND_URL', 'http://localhost:5173').replace(/\/$/, '');
  }

  async subscribe(slug: string, variantId: string, email: string): Promise<{ email: string }> {
    const variant = await this.alerts.findVariant(variantId);
    if (!variant || variant.product.slug !== slug || !variant.isActive || !variant.product.isActive) {
      throw new NotFoundException('Esa talla ya no está disponible en el catálogo');
    }
    if (variant.stock > 0) throw new BadRequestException('Esta talla ya tiene stock, agrégala a tu bolsa');
    await this.alerts.subscribe(variantId, email);
    return { email };
  }

  /**
   * Revisa las suscripciones pendientes cuyas variantes ya tienen stock y les avisa.
   * Se llama después de que el admin cambia inventario. Nunca lanza: un correo fallido no debe tirar el guardado.
   */
  async notifyBackInStock(): Promise<number> {
    try {
      const pending = await this.alerts.findPending();
      if (pending.length === 0) return 0;
      await Promise.all(
        pending.map((a) => this.mailer.send(StockMail.backInStock(a, `${this.frontend}/producto/${a.variant.product.slug}`))),
      );
      await this.alerts.markNotified(pending.map((a) => a.id));
      this.logger.log(`Avisos de stock enviados: ${pending.length}`);
      return pending.length;
    } catch (e) {
      this.logger.error(`No se pudieron enviar los avisos de stock: ${String(e)}`);
      return 0;
    }
  }
}
