import { formatOrderNumber, Order } from '@/modules/orders/domain/entities/order.entity';
import { MailMessage } from '../domain/mailer';

const mxn = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);

function itemsTable(order: Order) {
  const rows = order.items.map((i) => `<tr><td style="padding:6px 0">${esc(i.productName)}<br><span style="color:#777;font-size:12px">${esc(i.size)} · ${esc(i.color)} · ${i.quantity} × ${mxn(i.unitPrice)}</span></td><td style="text-align:right;vertical-align:top;padding:6px 0">${mxn(i.lineTotal)}</td></tr>`).join('');
  return `<table style="width:100%;border-collapse:collapse;font-size:14px">${rows}
  <tr><td style="padding-top:10px;border-top:1px solid #eee">Subtotal</td><td style="text-align:right;padding-top:10px;border-top:1px solid #eee">${mxn(order.subtotal)}</td></tr>
  ${order.discount > 0 ? `<tr><td>Descuento${order.couponCode ? ` (${order.couponCode})` : ''}</td><td style="text-align:right">-${mxn(order.discount)}</td></tr>` : ''}
  <tr><td>Envío</td><td style="text-align:right">${order.shippingCost === 0 ? 'Gratis' : mxn(order.shippingCost)}</td></tr>
  <tr><td style="font-weight:bold;padding-top:6px">Total</td><td style="text-align:right;font-weight:bold;padding-top:6px">${mxn(order.total)}</td></tr></table>`;
}

function layout(title: string, body: string, orderUrl: string) {
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111">
  <p style="font-size:22px;letter-spacing:.2em;font-weight:900;margin:0 0 20px">NORTE</p>
  <h1 style="font-size:20px;margin:0 0 12px">${title}</h1>${body}
  <p style="margin-top:24px"><a href="${orderUrl}" style="background:#111;color:#fff;padding:12px 20px;text-decoration:none;display:inline-block">Ver mi pedido</a></p>
  <p style="color:#777;font-size:12px;margin-top:24px">NORTE · Ropa urbana · Hecho en México</p></div>`;
}

const textItems = (o: Order) => o.items.map((i) => `- ${i.productName} (${i.size}, ${i.color}) × ${i.quantity}: ${mxn(i.lineTotal)}`).join('\n') + `\nTotal: ${mxn(o.total)}`;

export const OrderMail = {
  created(order: Order, orderUrl: string): MailMessage {
    const n = formatOrderNumber(order.number);
    return {
      to: order.email,
      subject: `Recibimos tu pedido ${n}`,
      html: layout(`Recibimos tu pedido ${n}`, `<p>Gracias por tu compra. En cuanto se confirme el pago lo preparamos para envío.</p>${itemsTable(order)}`, orderUrl),
      text: `Recibimos tu pedido ${n}.\n${textItems(order)}\nVerlo: ${orderUrl}`,
    };
  },
  paid(order: Order, orderUrl: string): MailMessage {
    const n = formatOrderNumber(order.number);
    const a = order.shippingAddress;
    return {
      to: order.email,
      subject: `Pago confirmado · pedido ${n}`,
      html: layout(`Pago confirmado`, `<p>Tu pedido <strong>${n}</strong> ya está pagado. Lo enviamos a:</p><p>${esc(a.fullName)}<br>${esc(a.street)} ${esc(a.extNumber)}${a.intNumber ? ` int. ${esc(a.intNumber)}` : ''}<br>${esc(a.neighborhood)}, ${esc(a.city)}, ${esc(a.state)}, CP ${esc(a.postalCode)}</p>${itemsTable(order)}`, orderUrl),
      text: `Tu pedido ${n} ya está pagado.\n${textItems(order)}\nVerlo: ${orderUrl}`,
    };
  },
  shipped(order: Order, orderUrl: string): MailMessage {
    const n = formatOrderNumber(order.number);
    const guide = order.trackingNumber ? ` Guía ${order.trackingCarrier ? esc(order.trackingCarrier) + ' ' : ''}<strong>${esc(order.trackingNumber)}</strong>.` : '';
    const guideText = order.trackingNumber ? ` Guía ${order.trackingCarrier ?? ''} ${order.trackingNumber}.` : '';
    return {
      to: order.email,
      subject: `Tu pedido ${n} va en camino`,
      html: layout(`Va en camino`, `<p>Tu pedido <strong>${n}</strong> ya salió. Llega en 3 a 5 días hábiles.${guide}</p>`, orderUrl),
      text: `Tu pedido ${n} ya salió. Llega en 3 a 5 días hábiles.${guideText} Verlo: ${orderUrl}`,
    };
  },
};
