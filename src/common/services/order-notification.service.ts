import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';

interface OrderNotificationData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  total: number;
  paymentMethod: string;
  deliveryMethod?: string;
  shippingAddress?: string;
  shippingCity?: string;
  items: { name: string; quantity: number; price: number; ml?: number }[];
}

@Injectable()
export class OrderNotificationService {
  private readonly adminEmail: string;
  private readonly adminWhatsapp: string;
  private readonly fromEmail: string;
  private readonly frontendUrl: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY', '');
    if (apiKey) sgMail.setApiKey(apiKey);

    this.adminEmail = this.configService.get<string>('ADMIN_EMAIL', '');
    this.adminWhatsapp = this.configService.get<string>('ADMIN_WHATSAPP', '');
    this.fromEmail = this.configService.get<string>('SENDGRID_FROM_EMAIL', 'noreply@nondecants.com');
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:4321');
  }

  /**
   * Send notifications for a new order (email to admin + client, WhatsApp link)
   */
  async notifyNewOrder(data: OrderNotificationData): Promise<{ whatsappUrl: string }> {
    const whatsappUrl = this.buildWhatsappUrl(data);

    // Send emails in background (don't block the response)
    this.sendAdminEmail(data).catch((err) =>
      console.error('[OrderNotification] Admin email failed:', err.message),
    );
    this.sendClientEmail(data).catch((err) =>
      console.error('[OrderNotification] Client email failed:', err.message),
    );

    return { whatsappUrl };
  }

  private buildWhatsappUrl(data: OrderNotificationData): string {
    const itemsList = data.items
      .map((i) => `• ${i.quantity}x ${i.name}${i.ml ? ` (${i.ml}ml)` : ''} — $${i.price.toFixed(2)}`)
      .join('\n');

    const msg = [
      `🛒 *Nueva orden NönDecants*`,
      ``,
      `📋 *Orden:* ${data.orderNumber}`,
      `👤 *Cliente:* ${data.customerName}`,
      `📧 *Email:* ${data.customerEmail}`,
      `📱 *Teléfono:* ${data.customerPhone}`,
      ``,
      `*Productos:*`,
      itemsList,
      ``,
      `💰 *Total:* $${data.total.toFixed(2)}`,
      `💳 *Pago:* ${data.paymentMethod}`,
      data.deliveryMethod ? `🚚 *Envío:* ${data.deliveryMethod}` : '',
      data.shippingAddress ? `📍 *Dirección:* ${data.shippingAddress}, ${data.shippingCity}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    return `https://wa.me/${this.adminWhatsapp}?text=${encodeURIComponent(msg)}`;
  }

  private async sendAdminEmail(data: OrderNotificationData): Promise<void> {
    if (!this.adminEmail) return;

    const itemsHtml = data.items
      .map(
        (i) =>
          `<tr><td style="padding:8px;border-bottom:1px solid #eee">${i.quantity}x ${i.name}${i.ml ? ` (${i.ml}ml)` : ''}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">$${i.price.toFixed(2)}</td></tr>`,
      )
      .join('');

    await sgMail.send({
      to: this.adminEmail,
      from: this.fromEmail,
      subject: `🛒 Nueva orden ${data.orderNumber} — $${data.total.toFixed(2)}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#CCB377">Nueva orden NönDecants</h2>
          <p><strong>Orden:</strong> ${data.orderNumber}</p>
          <p><strong>Cliente:</strong> ${data.customerName}</p>
          <p><strong>Email:</strong> ${data.customerEmail}</p>
          <p><strong>Teléfono:</strong> ${data.customerPhone}</p>
          <p><strong>Pago:</strong> ${data.paymentMethod}</p>
          ${data.shippingAddress ? `<p><strong>Envío a:</strong> ${data.shippingAddress}, ${data.shippingCity}</p>` : ''}
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <thead><tr><th style="text-align:left;padding:8px;border-bottom:2px solid #CCB377">Producto</th><th style="text-align:right;padding:8px;border-bottom:2px solid #CCB377">Precio</th></tr></thead>
            <tbody>${itemsHtml}</tbody>
            <tfoot><tr><td style="padding:8px;font-weight:bold">Total</td><td style="padding:8px;font-weight:bold;text-align:right">$${data.total.toFixed(2)}</td></tr></tfoot>
          </table>
        </div>
      `,
    });
  }

  private async sendClientEmail(data: OrderNotificationData): Promise<void> {
    if (!data.customerEmail) return;

    const itemsHtml = data.items
      .map(
        (i) =>
          `<tr><td style="padding:8px;border-bottom:1px solid #eee">${i.quantity}x ${i.name}${i.ml ? ` (${i.ml}ml)` : ''}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">$${i.price.toFixed(2)}</td></tr>`,
      )
      .join('');

    await sgMail.send({
      to: data.customerEmail,
      from: this.fromEmail,
      subject: `Tu orden ${data.orderNumber} ha sido registrada — NönDecants`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#CCB377">¡Gracias por tu compra!</h2>
          <p>Hola ${data.customerName},</p>
          <p>Tu orden <strong>${data.orderNumber}</strong> ha sido registrada exitosamente.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <thead><tr><th style="text-align:left;padding:8px;border-bottom:2px solid #CCB377">Producto</th><th style="text-align:right;padding:8px;border-bottom:2px solid #CCB377">Precio</th></tr></thead>
            <tbody>${itemsHtml}</tbody>
            <tfoot><tr><td style="padding:8px;font-weight:bold">Total</td><td style="padding:8px;font-weight:bold;text-align:right">$${data.total.toFixed(2)}</td></tr></tfoot>
          </table>
          ${data.paymentMethod === 'TRANSFERENCIA' ? '<p style="background:#FEF3CD;padding:12px;border-radius:8px">Recuerda subir tu comprobante de transferencia para procesar tu pedido.</p>' : ''}
          <p>Puedes revisar el estado de tu pedido en <a href="${this.frontendUrl}/mi-cuenta" style="color:#CCB377">Mi Cuenta</a>.</p>
          <p style="color:#999;font-size:12px">NönDecants — Perfumes de calidad</p>
        </div>
      `,
    });
  }
}
