import {
  baseEmailLayout,
  ctaButton,
  escapeHtml,
  itemsTable,
  noticeBlock,
  paragraph,
} from './base-layout';
import {
  OrderEmailData,
  servientregaTrackingUrl,
} from '../email.types';

export type ShipmentKind = 'full' | 'partial' | 'backorder';

/**
 * M-05 / M-06 / M-07 · Guía Servientrega generada.
 * - full: pedido completo despachado (M-05).
 * - partial: pedido mixto, se despacha lo que está en stock (M-06) — aclara
 *   que los productos bajo pedido llegarán después con su propia guía.
 * - backorder: segunda guía con los productos bajo pedido (M-07).
 */
export function getOrderShippedEmailHtml(
  data: OrderEmailData,
  trackingCode: string,
  kind: ShipmentKind,
): string {
  const firstName = escapeHtml((data.customerName || '').split(' ')[0] || 'Cliente');
  const trackingUrl = servientregaTrackingUrl(trackingCode);

  const intro =
    kind === 'backorder'
      ? `Hola <strong style="color:#FFFFFF;">${firstName}</strong>, los productos bajo pedido de tu orden
         <strong style="color:#FFFFFF;">${escapeHtml(data.orderNumber)}</strong> ya fueron despachados.
         Este es el segundo envío de tu pedido.`
      : `Hola <strong style="color:#FFFFFF;">${firstName}</strong>, tu pedido
         <strong style="color:#FFFFFF;">${escapeHtml(data.orderNumber)}</strong> fue despachado.`;

  const mixedNotice =
    kind === 'partial'
      ? noticeBlock(
          `Este envío incluye los productos disponibles en stock. Los productos
          <strong>bajo pedido</strong> llegarán después y generarán su propia guía:
          te avisaremos con su tracking cuando sean despachados.`,
        )
      : '';

  const body = `
    ${paragraph(intro)}
    ${mixedNotice}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;background-color:#262323;border-radius:6px;">
      <tr>
        <td style="padding:16px 20px;">
          <p style="margin:0 0 6px;font-size:12px;color:#CCB377;letter-spacing:1px;text-transform:uppercase;">Guía Servientrega</p>
          <p style="margin:0;font-size:18px;color:#FFFFFF;font-weight:700;letter-spacing:1px;">${escapeHtml(trackingCode)}</p>
        </td>
      </tr>
    </table>
    ${ctaButton('Rastrear mi envío', trackingUrl)}
    ${itemsTable(data.items)}
    ${paragraph(
      `También puedes revisar el estado de tu pedido cuando quieras desde tu cuenta en NonDecants.`,
    )}
  `;

  return baseEmailLayout('Tu pedido fue despachado', body);
}
