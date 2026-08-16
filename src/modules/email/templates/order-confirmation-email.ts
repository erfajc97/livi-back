import {
  baseEmailLayout,
  escapeHtml,
  greeting,
  itemsTable,
  noticeBlock,
  orderFacts,
  paragraph,
  shippingBlock,
  totalsTable,
  whatsappClosing,
} from './base-layout';
import { BAJO_PEDIDO_LEAD_TIME, OrderEmailData } from '../email.types';

/**
 * Aviso de las líneas que se importan: llegan aparte y más tarde, así que el
 * cliente tiene que saberlo antes de preguntarse dónde está la mitad del
 * pedido.
 */
function backorderNotice(data: OrderEmailData): string {
  const backordered = data.items.filter((i) => (i.bajoPedidoQuantity ?? 0) > 0);
  if (backordered.length === 0) return '';
  const list = backordered
    .map(
      (i) =>
        `${i.bajoPedidoQuantity}x ${escapeHtml(i.name)}${i.ml ? ` (${i.ml} ml)` : ''}`,
    )
    .join(', ');
  return noticeBlock(
    `<strong>Productos bajo pedido:</strong> ${list}.
     <br>Los traemos exclusivamente para ti: llegan en <strong>${BAJO_PEDIDO_LEAD_TIME}</strong>
     y se despachan con su propia guía. El resto de tu pedido se prepara de inmediato.`,
  );
}

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
    ${backorderNotice(data)}
    ${whatsappClosing(data.orderNumber)}
  `;
}

/** Asunto de la confirmación de compra pagada (tarjeta). */
export function getOrderConfirmationSubject(orderNumber: string): string {
  return `¡Gracias por tu compra en NonDecants! Pedido ${orderNumber} recibido`;
}

/**
 * M-01 · Pedido con tarjeta aprobado (automático) → confirmación inmediata.
 * El pago ya entró, así que el texto da la compra por cerrada.
 */
export function getOrderConfirmationEmailHtml(data: OrderEmailData): string {
  const body = orderBody(
    data,
    '¡Gracias por comprar en NonDecants! Hemos recibido tu pedido correctamente.',
    'Aquí tienes todos los detalles de tu compra:',
  );

  return baseEmailLayout(
    `¡Gracias por tu compra! Pedido ${escapeHtml(data.orderNumber)} recibido`,
    body,
  );
}

/** Asunto del acuse de pedido sin pago confirmado (efectivo/transferencia). */
export function getOrderPlacedSubject(orderNumber: string): string {
  return `¡Gracias por realizar tu pedido en NonDecants! Pedido ${orderNumber} recibido`;
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
