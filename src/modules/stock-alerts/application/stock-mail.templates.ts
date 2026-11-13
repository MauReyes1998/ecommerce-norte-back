import { MailMessage } from '@/modules/notifications/domain/mailer';
import { PendingAlert } from '../domain/stock-alert.repository';

const esc = (s: string) => s.replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c] as string);

export const StockMail = {
  backInStock(alert: PendingAlert, productUrl: string): MailMessage {
    const { product, size, color, stock } = alert.variant;
    const few = stock <= 3 ? ` Quedan pocas (${stock}), no te duermas.` : '';
    return {
      to: alert.email,
      subject: `Ya volvió: ${product.name} en talla ${size}`,
      text: `Buenas noticias: ${product.name} (${color}, talla ${size}) ya está disponible otra vez.${few}\n\nCómpralo aquí: ${productUrl}\n\nNORTE`,
      html: `
<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#111">
  <h1 style="font-size:20px;letter-spacing:.08em">NORTE</h1>
  <p style="font-size:16px">Buenas noticias: <strong>${esc(product.name)}</strong> (${esc(color)}, talla ${esc(size)}) ya está disponible otra vez.${few}</p>
  <p style="margin:24px 0"><a href="${productUrl}" style="background:#111;color:#fff;text-decoration:none;padding:12px 20px;display:inline-block">Ver producto</a></p>
  <p style="font-size:12px;color:#666">Te mandamos este correo porque pediste que te avisáramos cuando hubiera stock. No volveremos a escribirte por esta talla a menos que lo pidas de nuevo.</p>
</div>`,
    };
  },
};
