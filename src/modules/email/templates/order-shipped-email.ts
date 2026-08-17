import {
  baseEmailLayout,
  ctaButton,
  escapeHtml,
  greeting,
  itemsTable,
  noticeBlock,
  paragraph,
  shippingBlock,
  whatsappClosing,
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
  const trackingUrl = servientregaTrackingUrl(trackingCode);

  const intro =
    kind === 'backorder'
      ? `Los productos bajo pedido de tu orden
         <strong style="color:#1C1A17;font-weight:600;">${escapeHtml(data.orderNumber)}</strong> ya fueron despachados.
         Este es el segundo envío de tu pedido.`
      : `Tu pedido <strong style="color:#1C1A17;font-weight:600;">${escapeHtml(data.orderNumber)}</strong> fue despachado.`;

  const mixedNotice =
    kind === 'partial'
      ? noticeBlock(
          `Este envío incluye los productos disponibles en stock. Los productos
          <strong>bajo pedido</strong> llegarán después y generarán su propia guía:
          te avisaremos con su tracking cuando sean despachados.`,
        )
      : '';

  const body = `
    ${greeting(data)}
    ${paragraph(intro)}
    ${mixedNotice}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;background-color:#F3EBDB;border-radius:6px;">
      <tr>
        <td style="width:3px;background-color:#CCB377;">&nbsp;</td>
        <td style="padding:18px 22px;">
          <p style="margin:0 0 6px;font-family:'Cormorant Garamond','Cormorant',Georgia,serif;font-size:20px;font-weight:600;color:#1C1A17;">Guía Servientrega</p>
          <!-- El número va en sans: la serif de marca usa cifras antiguas, que
               en un código de guía se leen mal y se copian peor. -->
          <p style="margin:0;font-family:'DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:24px;line-height:1.2;color:#1C1A17;font-weight:600;letter-spacing:2px;">${escapeHtml(trackingCode)}</p>
        </td>
      </tr>
    </table>
    ${ctaButton('Rastrear mi envío', trackingUrl)}
    ${itemsTable(data.items)}
    ${shippingBlock(data)}
    ${paragraph(
      'También puedes revisar el estado de tu pedido cuando quieras desde tu cuenta en NonDecants.',
    )}
    ${whatsappClosing(data.orderNumber)}
  `;

  return baseEmailLayout('Tu pedido fue despachado', body);
}
