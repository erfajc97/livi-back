import {
  baseEmailLayout,
  escapeHtml,
  greeting,
  itemsTable,
  orderFacts,
  paragraph,
  shippingBlock,
  totalsTable,
  whatsappClosing,
} from './base-layout';
import { OrderEmailData } from '../email.types';

/** Cuerpo común: detalles, productos, totales, dirección y WhatsApp. */
function orderBody(data: OrderEmailData, intro: string, lead: string): string {
  return `
    ${greeting(data)}
    ${paragraph(intro)}
    ${paragraph(lead)}
    ${orderFacts(data)}
    ${itemsTable(data.items)}
    ${totalsTable(data)}
    ${shippingBlock(data)}
    ${whatsappClosing(data.orderNumber)}
  `;
}

/** Asunto de la confirmación de compra pagada (tarjeta). */
export function getOrderConfirmationSubject(orderNumber: string): string {
  return `¡Gracias por tu compra en LIVI! Pedido ${orderNumber} recibido`;
}

/**
 * M-01 · Pedido con tarjeta aprobado (automático) → confirmación inmediata.
 * El pago ya entró, así que el texto da la compra por cerrada.
 */
export function getOrderConfirmationEmailHtml(data: OrderEmailData): string {
  const body = orderBody(
    data,
    '¡Gracias por comprar en LIVI! Hemos recibido tu pedido correctamente.',
    'Aquí tienes todos los detalles de tu compra:',
  );

  return baseEmailLayout(
    `¡Gracias por tu compra! Pedido ${escapeHtml(data.orderNumber)} recibido`,
    body,
  );
}

/** Asunto del acuse de pedido sin pago confirmado (efectivo/transferencia). */
export function getOrderPlacedSubject(orderNumber: string): string {
  return `¡Gracias por realizar tu pedido en LIVI! Pedido ${orderNumber} recibido`;
}

/**
 * M-00 · Pedido creado con efectivo o transferencia. El pago todavía no está
 * validado, así que se habla de "solicitud de pedido": sin este correo el
 * cliente pagaba y no recibía nada hasta que alguien revisara el comprobante.
 */
export function getOrderPlacedEmailHtml(data: OrderEmailData): string {
  const body = orderBody(
    data,
    'Hemos recibido tu pedido con éxito. Una vez hayamos validado el pago, se tramitará de inmediato.',
    'Aquí tienes todos los detalles de tu solicitud de pedido:',
  );

  return baseEmailLayout(
    `¡Gracias por realizar tu pedido! Pedido ${escapeHtml(data.orderNumber)} recibido`,
    body,
  );
}
