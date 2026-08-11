import {
  baseEmailLayout,
  escapeHtml,
  itemsTable,
  noticeBlock,
  paragraph,
  shippingBlock,
  totalsTable,
} from './base-layout';
import { OrderEmailData } from '../email.types';

/**
 * M-02 · Pedido con transferencia creado (comprobante subido, sin validar).
 * Acuse intermedio: deja claro que el pedido NO se confirma hasta validar
 * el pago. Incluye el detalle completo de la orden.
 */
export function getTransferReceivedEmailHtml(data: OrderEmailData): string {
  const firstName = escapeHtml((data.customerName || '').split(' ')[0] || 'Cliente');

  const body = `
    ${paragraph(
      `Hola <strong style="color:#FFFFFF;">${firstName}</strong>, recibimos tu orden
      <strong style="color:#FFFFFF;">${escapeHtml(data.orderNumber)}</strong> junto con tu
      comprobante de transferencia.`,
    )}
    ${noticeBlock(
      `<strong>Una vez validado tu pago, tu pedido se procesará automáticamente.</strong>
      <br>Tu orden aún no está confirmada: nuestro equipo valida el comprobante y te
      confirmaremos por correo en breve.`,
    )}
    ${itemsTable(data.items)}
    ${totalsTable(data)}
    ${shippingBlock(data)}
    ${paragraph(
      `Si el pago no puede validarse, te escribiremos para que puedas intentarlo nuevamente.`,
    )}
  `;

  return baseEmailLayout('Recibimos tu orden', body);
}

/**
 * M-03 · Transferencia aprobada por admin (tras validación manual).
 */
export function getTransferApprovedEmailHtml(data: OrderEmailData): string {
  const firstName = escapeHtml((data.customerName || '').split(' ')[0] || 'Cliente');

  const body = `
    ${paragraph(
      `Hola <strong style="color:#FFFFFF;">${firstName}</strong>, tu pago fue validado.
      Tu pedido <strong style="color:#FFFFFF;">${escapeHtml(data.orderNumber)}</strong>
      fue recibido con éxito y se preparará en breve.`,
    )}
    ${itemsTable(data.items)}
    ${totalsTable(data)}
    ${shippingBlock(data)}
    ${paragraph(
      `Te avisaremos por correo cuando sea despachado, con su guía de Servientrega.`,
    )}
  `;

  return baseEmailLayout('Pedido confirmado', body);
}

/**
 * M-04 · Transferencia rechazada por admin.
 */
export function getTransferRejectedEmailHtml(data: OrderEmailData): string {
  const firstName = escapeHtml((data.customerName || '').split(' ')[0] || 'Cliente');

  const body = `
    ${paragraph(
      `Hola <strong style="color:#FFFFFF;">${firstName}</strong>, tu pedido
      <strong style="color:#FFFFFF;">${escapeHtml(data.orderNumber)}</strong> fue rechazado
      por falta de validación de pago.`,
    )}
    ${noticeBlock(
      `Puedes intentar pagar nuevamente o contactarnos por
      <a href="https://wa.me/593992305463" style="color:#CCB377;text-decoration:none;">WhatsApp</a>
      y te ayudamos a completar tu compra.`,
    )}
    ${itemsTable(data.items)}
    ${totalsTable(data)}
  `;

  return baseEmailLayout('No pudimos validar tu pago', body);
}
