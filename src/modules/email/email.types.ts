/**
 * Datos que comparten las plantillas de correo de pedidos (matriz M-01…M-13).
 */
export interface OrderEmailItem {
  name: string;
  quantity: number;
  price: number;
  /** Tamaño en ml cuando la línea es un decant. */
  ml?: number;
  /** Unidades de la línea que quedan bajo pedido (se importan). */
  bajoPedidoQuantity?: number;
}

export interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  paymentMethod?: string;
  deliveryMethod?: string;
  shippingAddress?: string;
  shippingCity?: string;
  subtotal: number;
  deliveryCost?: number;
  payphoneSurcharge?: number;
  couponDiscount?: number;
  total: number;
  items: OrderEmailItem[];
}

/** Texto estándar del sitio para el tiempo de entrega bajo pedido. */
export const BAJO_PEDIDO_LEAD_TIME = '13–17 días';

/** URL pública de rastreo de Servientrega para una guía. */
export function servientregaTrackingUrl(trackingCode: string): string {
  return `https://www.servientrega.com.ec/Tracking/Index/?guia=${encodeURIComponent(
    trackingCode,
  )}`;
}
