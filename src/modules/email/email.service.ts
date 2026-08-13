import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { getVerificationEmailHtml } from './templates/verification-email';
import { getPasswordResetEmailHtml } from './templates/password-reset-email';
import { getGuestAccountEmailHtml } from './templates/guest-account-email';
import { getOrderConfirmationEmailHtml } from './templates/order-confirmation-email';
import {
  getTransferApprovedEmailHtml,
  getTransferReceivedEmailHtml,
  getTransferRejectedEmailHtml,
} from './templates/transfer-emails';
import {
  getOrderShippedEmailHtml,
  ShipmentKind,
} from './templates/order-shipped-email';
import { getOrderDeliveredEmailHtml } from './templates/order-delivered-email';
import { getAbandonedCartEmailHtml } from './templates/abandoned-cart-email';
import { getWelcomeEmailHtml } from './templates/welcome-email';
import { getAdminNewOrderEmailHtml } from './templates/admin-new-order-email';
import { BRAND_NAME } from './templates/base-layout';
import { OrderEmailData, OrderEmailItem } from './email.types';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;
  private readonly frontendUrl: string;
  private readonly adminEmail: string;
  private readonly fromName: string;
  private resend: Resend | null = null;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (apiKey && apiKey.startsWith('re_')) {
      this.resend = new Resend(apiKey);
      this.logger.log('Resend configurado');
    } else {
      this.logger.warn(
        'RESEND_API_KEY sin configurar: los correos solo se registran en el log',
      );
    }
    // Remitente de toda la matriz de mailing. El dominio debe estar verificado
    // en Resend (SPF + DKIM) o los envíos se rechazan.
    this.fromEmail =
      this.configService.get<string>('MAIL_FROM_EMAIL') ||
      'noreply@nondecants.com';
    this.fromName =
      this.configService.get<string>('MAIL_FROM_NAME') || BRAND_NAME;
    // FRONTEND_URL también alimenta la lista de CORS y puede venir con varios
    // orígenes separados por coma; para los enlaces del correo se usa el
    // primero, sin barra final.
    const configuredFrontend = (this.configService.get<string>('FRONTEND_URL') ?? '')
      .split(',')[0]
      .trim()
      .replace(/\/+$/, '');
    this.frontendUrl = configuredFrontend || 'http://localhost:4321';
    if (
      this.configService.get<string>('NODE_ENV') === 'production' &&
      (!configuredFrontend || /localhost/i.test(configuredFrontend))
    ) {
      // Sin esto los correos salen con enlaces a localhost: el cliente no puede
      // verificar su cuenta ni resetear su contraseña.
      this.logger.error(
        `FRONTEND_URL no apunta al sitio público (valor actual: "${this.frontendUrl}"). ` +
          'Los enlaces de verificación y de reseteo de contraseña saldrán rotos.',
      );
    }
    // M-13: alerta interna de pedidos nuevos.
    this.adminEmail =
      this.configService.get<string>('ADMIN_EMAIL') || 'nondecants@gmail.com';
  }

  /**
   * Envío genérico por Resend. Sin API key solo registra en log (DEV).
   * Nunca lanza: un correo fallido no debe romper el flujo de negocio.
   */
  private async send(
    to: string,
    subject: string,
    html: string,
    logLabel: string,
  ): Promise<void> {
    if (!to) return;

    if (!this.resend) {
      this.logger.log(`[DEV] ${logLabel} para ${to}: "${subject}"`);
      return;
    }

    try {
      // Resend responde 200 con `error` en el cuerpo cuando rechaza el envío
      // (dominio sin verificar, destinatario inválido…): hay que mirarlo.
      const { error } = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [to],
        subject,
        html,
      });
      if (error) {
        this.logger.error(
          `Resend rechazó ${logLabel} para ${to}: ${error.name} — ${error.message}`,
        );
        return;
      }
      this.logger.log(`${logLabel} enviado a ${to}`);
    } catch (error) {
      this.logger.error(`Fallo al enviar ${logLabel} a ${to}`, error);
    }
  }

  async sendVerificationEmail(
    email: string,
    firstName: string,
    token: string,
  ): Promise<void> {
    const verificationUrl = `${this.frontendUrl}/verificar-email?token=${token}`;
    await this.send(
      email,
      'Verifica tu email — NonDecants',
      getVerificationEmailHtml(firstName, verificationUrl),
      'Correo de verificación',
    );
  }

  async sendPasswordResetEmail(
    email: string,
    firstName: string,
    token: string,
  ): Promise<void> {
    const resetUrl = `${this.frontendUrl}/restablecer-contrasena?token=${token}`;
    await this.send(
      email,
      'Restablecer contraseña — NonDecants',
      getPasswordResetEmailHtml(firstName, resetUrl),
      'Correo de restablecimiento de contraseña',
    );
  }

  /**
   * Credenciales de la cuenta creada automáticamente en un guest checkout.
   * Incluye la contraseña temporal — por eso solo se envía una vez, al crear.
   */
  async sendGuestAccountEmail(
    email: string,
    firstName: string,
    password: string,
  ): Promise<void> {
    const loginUrl = `${this.frontendUrl}/mi-cuenta`;
    await this.send(
      email,
      'Tu cuenta de NonDecants está lista — NonDecants',
      getGuestAccountEmailHtml(firstName, email, password, loginUrl),
      'Correo de cuenta guest',
    );
  }

  /** M-10 · Cuenta creada → bienvenida. */
  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    await this.send(
      email,
      'Bienvenido a NonDecants — NonDecants',
      getWelcomeEmailHtml(firstName, this.frontendUrl),
      'Correo de bienvenida',
    );
  }

  /** M-01 · Pedido con tarjeta aprobado → confirmación con detalle. */
  async sendOrderConfirmationEmail(data: OrderEmailData): Promise<void> {
    await this.send(
      data.customerEmail,
      `Pedido confirmado ${data.orderNumber} — NonDecants`,
      getOrderConfirmationEmailHtml(data),
      'Confirmación de pedido (M-01)',
    );
  }

  /** M-02 · Transferencia creada (comprobante subido, sin validar) → acuse. */
  async sendTransferReceivedEmail(data: OrderEmailData): Promise<void> {
    await this.send(
      data.customerEmail,
      `Recibimos tu orden ${data.orderNumber} — NonDecants`,
      getTransferReceivedEmailHtml(data),
      'Acuse de transferencia (M-02)',
    );
  }

  /** M-03 · Transferencia aprobada por admin. */
  async sendTransferApprovedEmail(data: OrderEmailData): Promise<void> {
    await this.send(
      data.customerEmail,
      `Pedido confirmado ${data.orderNumber} — NonDecants`,
      getTransferApprovedEmailHtml(data),
      'Transferencia aprobada (M-03)',
    );
  }

  /** M-04 · Transferencia rechazada por admin. */
  async sendTransferRejectedEmail(data: OrderEmailData): Promise<void> {
    await this.send(
      data.customerEmail,
      `No pudimos validar tu pago — orden ${data.orderNumber} — NonDecants`,
      getTransferRejectedEmailHtml(data),
      'Transferencia rechazada (M-04)',
    );
  }

  /**
   * M-05 / M-06 / M-07 · Guía Servientrega generada → despacho + tracking.
   * `kind`: 'full' pedido completo, 'partial' primer envío de pedido mixto,
   * 'backorder' segunda guía con los productos bajo pedido.
   */
  async sendOrderShippedEmail(
    data: OrderEmailData,
    trackingCode: string,
    kind: ShipmentKind,
  ): Promise<void> {
    const subject =
      kind === 'backorder'
        ? `Tu pedido ${data.orderNumber} fue despachado (segundo envío) — NonDecants`
        : `Tu pedido ${data.orderNumber} fue despachado — NonDecants`;
    await this.send(
      data.customerEmail,
      subject,
      getOrderShippedEmailHtml(data, trackingCode, kind),
      `Guía de despacho (M-05/06/07, ${kind})`,
    );
  }

  /** M-08 · Servientrega marca "entregado" → carta de agradecimiento. */
  async sendOrderDeliveredEmail(
    email: string,
    customerName: string,
  ): Promise<void> {
    await this.send(
      email,
      'Tu perfume ha llegado — NonDecants',
      getOrderDeliveredEmailHtml(customerName),
      'Carta de agradecimiento (M-08)',
    );
  }

  /** M-09 · Carrito abandonado (solo clientes registrados). */
  async sendAbandonedCartEmail(
    email: string,
    firstName: string,
    items: OrderEmailItem[],
  ): Promise<void> {
    await this.send(
      email,
      'Tu carrito te espera — NonDecants',
      getAbandonedCartEmailHtml(firstName, items, this.frontendUrl),
      'Recordatorio de carrito abandonado (M-09)',
    );
  }

  /** M-13 · Alerta interna de pedido nuevo a nondecants@gmail.com. */
  async sendAdminNewOrderEmail(data: OrderEmailData): Promise<void> {
    await this.send(
      this.adminEmail,
      `Nueva orden ${data.orderNumber} — $${Number(data.total || 0).toFixed(2)}`,
      getAdminNewOrderEmailHtml(data),
      'Alerta interna de pedido (M-13)',
    );
  }
}
