import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../../modules/email/email.service';

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
  private readonly adminWhatsapp: string;

  constructor(
    private configService: ConfigService,
    private emailService: EmailService,
  ) {
    this.adminWhatsapp = this.configService.get<string>('ADMIN_WHATSAPP', '');
  }

  /**
   * Notificaciones de pedido nuevo: alerta interna por correo (M-13, a
   * nondecants@gmail.com vía EmailService) + link de WhatsApp para el admin.
   * Los correos al cliente NO se envían aquí: siguen la matriz de mailing
   * (M-01 al aprobarse la tarjeta, M-02 al subir el comprobante, etc.).
   */
  async notifyNewOrder(data: OrderNotificationData): Promise<{ whatsappUrl: string }> {
    const whatsappUrl = this.buildWhatsappUrl(data);

    // M-13 en background (no bloquea la respuesta)
    this.emailService
      .sendAdminNewOrderEmail({
        orderNumber: data.orderNumber,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        paymentMethod: data.paymentMethod,
        deliveryMethod: data.deliveryMethod,
        shippingAddress: data.shippingAddress,
        shippingCity: data.shippingCity,
        subtotal: data.total,
        total: data.total,
        items: data.items,
      })
      .catch((err) =>
        console.error('[OrderNotification] Admin email failed:', err.message),
      );

    return { whatsappUrl };
  }

  private buildWhatsappUrl(data: OrderNotificationData): string {
    const itemsList = data.items
      .map((i) => `• ${i.quantity}x ${i.name}${i.ml ? ` (${i.ml}ml)` : ''} — $${i.price.toFixed(2)}`)
      .join('\n');

    const msg = [
      `🛒 *Nueva orden NonDecants*`,
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
}
