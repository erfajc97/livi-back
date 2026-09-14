import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface WalletfyResponse {
  ok: boolean;
  status: number;
  data: any;
}

export interface WalletfyOrderData {
  name: string;
  email?: string | null;
  phone?: string | null;
  total: number;
}

/**
 * Walletfy — tarjetas de fidelidad (Apple & Google Wallet).
 * Cuando una orden queda PAGADA se crea/encuentra al cliente y se le suma
 * el sello o los puntos de la compra. Todo fire-and-forget: un fallo de
 * Walletfy NUNCA rompe el flujo del checkout.
 * Docs: https://app.getwalletfy.com/docs/ecommerce
 */
@Injectable()
export class WalletfyService {
  private readonly logger = new Logger(WalletfyService.name);
  private readonly apiUrl = 'https://api.getwalletfy.com/public-api/v1';
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('WALLETFY_API_KEY', '');
  }

  /** Nunca lanza — el caller decide qué hacer con un 400/403/404/429. */
  private async callWalletfy(
    endpoint: string,
    body: Record<string, unknown>,
  ): Promise<WalletfyResponse> {
    if (!this.apiKey) {
      return { ok: false, status: 0, data: { message: 'WALLETFY_API_KEY no configurada' } };
    }
    try {
      const res = await axios.post(`${this.apiUrl}${endpoint}`, body, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
        validateStatus: () => true,
      });
      return { ok: res.status >= 200 && res.status < 300, status: res.status, data: res.data ?? {} };
    } catch (error: any) {
      return { ok: false, status: 0, data: { message: error?.message ?? 'network error' } };
    }
  }

  /**
   * Recompensa la compra: crea/encuentra al cliente (por email o teléfono) y
   * le suma el sello/puntos del monto. Idempotente por diseño de Walletfy:
   * máximo 1 sello cada 6h por cliente (429 con cooldown si repite).
   */
  async rewardOrder(order: WalletfyOrderData): Promise<void> {
    const email = order.email?.trim() || null;
    const phone = order.phone?.trim() || null;
    if (!email && !phone) return; // sin identificador no hay tarjeta a quién sumar

    const customer = await this.callWalletfy('/customers', {
      name: order.name?.trim() || email || phone,
      email,
      phone,
    });

    if (!customer.ok || !customer.data?.customerId) {
      // 401 = API key inválida · 403 = plan sin ecommerce habilitado
      this.logger.error(
        `No se pudo crear/encontrar el cliente (${customer.status}): ${customer.data?.message ?? 'error desconocido'}`,
      );
      return;
    }

    const stamp = await this.callWalletfy('/stamps', {
      customerId: customer.data.customerId,
      amount: Number(order.total),
    });

    if (!stamp.ok) {
      // 400 minimumPurchaseAmount = no alcanzó el mínimo · 429 cooldown = visita reciente
      this.logger.warn(
        `No se sumó el sello (${stamp.status}): ${stamp.data?.message ?? 'error desconocido'}`,
      );
      return;
    }

    this.logger.log(
      `Sello/puntos sumados a ${customer.data.customerId} por $${order.total}`,
    );
  }
}
