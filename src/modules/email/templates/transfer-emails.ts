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
import { OrderEmailData } from '../email.types';

/**
 * M-02 · Pedido con transferencia creado (comprobante subido, sin validar).
 * Acuse intermedio: deja claro que el pedido NO se confirma hasta validar
 * el pago. Incluye el detalle completo de la orden.
 */
export function getTransferReceivedEmailHtml(data: OrderEmailData): string {
  const body = `
    ${greeting(data)}
    ${paragraph(
      `Recibimos tu pedido <strong style="color:#1C1A17;font-weight:600;">${escapeHtml(data.orderNumber)}</strong>
       junto con tu comprobante de transferencia.`,
    )}
    ${noticeBlock(
      `<strong>Una vez validado tu pago, tu pedido se procesará automáticamente.</strong>
      <br>Tu orden aún no está confirmada: nuestro equipo valida el comprobante y te
      confirmaremos por correo en breve.`,
    )}
    ${paragraph('Aquí tienes todos los detalles de tu solicitud de pedido:')}
    ${orderFacts(data)}
    ${itemsTable(data.items)}
    ${totalsTable(data)}
    ${shippingBlock(data)}
    ${paragraph(
      'Si el pago no puede validarse, te escribiremos para que puedas intentarlo nuevamente.',
    )}
    ${whatsappClosing(data.orderNumber)}
  `;

  return baseEmailLayout(
    `Recibimos tu pedido ${escapeHtml(data.orderNumber)}`,
    body,
  );
}

/**
 * M-03 · Transferencia aprobada por admin (tras validación manual).
 */
export function getTransferApprovedEmailHtml(data: OrderEmailData): string {
  const body = `
    ${greeting(data)}
    ${paragraph(
      `Tu pago fue validado. Tu pedido <strong style="color:#1C1A17;font-weight:600;">${escapeHtml(data.orderNumber)}</strong>
       está confirmado y se preparará en breve.`,
    )}
    ${paragraph('Aquí tienes todos los detalles de tu compra:')}
    ${orderFacts(data)}
    ${itemsTable(data.items)}
    ${totalsTable(data)}
    ${shippingBlock(data)}
    ${paragraph(
      'Te avisaremos por correo cuando sea despachado, con su guía de Servientrega.',
    )}
    ${whatsappClosing(data.orderNumber)}
  `;

  return baseEmailLayout(
    `¡Pedido ${escapeHtml(data.orderNumber)} confirmado!`,
    body,
  );
}

/**
 * M-04 · Transferencia rechazada por admin.
 */
export function getTransferRejectedEmailHtml(data: OrderEmailData): string {
  const body = `
    ${greeting(data)}
    ${paragraph(
      `No pudimos validar el pago de tu pedido
       <strong style="color:#1C1A17;font-weight:600;">${escapeHtml(data.orderNumber)}</strong>,
       así que quedó en pausa.`,
    )}
    ${noticeBlock(
      'Puedes intentar pagar nuevamente o escribirnos por WhatsApp y te ayudamos a completar tu compra.',
    )}
    ${orderFacts(data)}
    ${itemsTable(data.items)}
    ${totalsTable(data)}
    ${whatsappClosing(data.orderNumber)}
  `;

  return baseEmailLayout('No pudimos validar tu pago', body);
}
