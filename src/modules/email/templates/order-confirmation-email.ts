import {
  baseEmailLayout,
  escapeHtml,
  itemsTable,
  noticeBlock,
  paragraph,
  shippingBlock,
  totalsTable,
} from './base-layout';
import {
  BAJO_PEDIDO_LEAD_TIME,
  OrderEmailData,
} from '../email.types';

/**
 * M-01 · Pedido con tarjeta aprobado (automático) → confirmación inmediata.
 * Detalle de productos, monto pagado y dirección de envío. Los productos
 * bajo pedido se detallan aparte con su tiempo de entrega.
 */
export function getOrderConfirmationEmailHtml(data: OrderEmailData): string {
  const firstName = escapeHtml((data.customerName || '').split(' ')[0] || 'Cliente');
  const backorderItems = data.items.filter(
    (i) => (i.bajoPedidoQuantity ?? 0) > 0,
  );

  const backorderSection =
    backorderItems.length > 0
      ? noticeBlock(
          `<strong>Productos bajo pedido:</strong> ${backorderItems
            .map(
              (i) =>
                `${i.bajoPedidoQuantity}x ${escapeHtml(i.name)}${i.ml ? ` (${i.ml} ml)` : ''}`,
            )
            .join(', ')}.
          <br>Los traemos exclusivamente para ti: llegan en <strong>${BAJO_PEDIDO_LEAD_TIME}</strong>
          y se despachan con su propia guía. El resto de tu pedido se prepara de inmediato.`,
        )
      : '';

  const body = `
    ${paragraph(
      `Hola <strong style="color:#FFFFFF;">${firstName}</strong>, tu pago fue aprobado y tu pedido
      <strong style="color:#FFFFFF;">${escapeHtml(data.orderNumber)}</strong> está confirmado.
      Estos son los detalles de tu compra:`,
    )}
    ${itemsTable(data.items)}
    ${totalsTable(data)}
    ${shippingBlock(data)}
    ${backorderSection}
    ${paragraph(
      `Te avisaremos por correo cuando tu pedido sea despachado, con su guía de Servientrega.`,
    )}
  `;

  return baseEmailLayout('¡Gracias por tu compra!', body);
}
