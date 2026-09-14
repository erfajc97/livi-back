/**
 * Datos que comparten las plantillas de correo de pedidos (matriz M-01…M-13).
 */
export interface OrderEmailItem {
  name: string;
  quantity: number;
  price: number;
}

/**
 * Los métodos viajan como código (PAYPHONE, SERVIENTREGA_GYE…). En el correo
 * el cliente tiene que leer su forma de pago y de entrega, no el enum:
 * "ENTREGA — SERVIENTREGA_GYE" no le dice nada a nadie.
 */
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  PAYPHONE: 'Tarjeta de crédito/débito (Payphone)',
  TARJETA: 'Tarjeta de crédito/débito',
  TRANSFERENCIA: 'Transferencia bancaria',
  EFECTIVO: 'Efectivo',
};

const DELIVERY_METHOD_LABELS: Record<string, string> = {
  ENTREGA_PERSONAL: 'Entrega personal — Plaza Tía (La Joya)',
  RETIRO_PIWU: 'Retiro en Piwu Market (Urdesa)',
  SERVIENTREGA_GYE: 'Servientrega — Guayaquil, Durán y Samborondón',
  SERVIENTREGA_NACIONAL: 'Servientrega Nacional — Provincias',
};

/** Nombre legible del método, o el código tal cual si es uno desconocido. */
export function paymentMethodLabel(method?: string): string {
  if (!method) return '';
  return PAYMENT_METHOD_LABELS[method] ?? method;
}

export function deliveryMethodLabel(method?: string): string {
  if (!method) return '';
  return DELIVERY_METHOD_LABELS[method] ?? method;
}

/** Fecha en formato local ecuatoriano: "14 de agosto de 2026, 20:03". */
export function formatOrderDate(date?: Date | string): string {
  if (!date) return '';
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return '';
  return new Intl.DateTimeFormat('es-EC', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Guayaquil',
  }).format(value);
}

export interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  paymentMethod?: string;
  /** Fecha de creación del pedido, para el bloque de detalles. */
  createdAt?: Date | string;
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

/** URL pública de rastreo de Servientrega para una guía. */
export function servientregaTrackingUrl(trackingCode: string): string {
  return `https://www.servientrega.com.ec/Tracking/Index/?guia=${encodeURIComponent(
    trackingCode,
  )}`;
}
