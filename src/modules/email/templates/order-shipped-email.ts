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

export type ShipmentKind = 'full';

/**
 * M-05 · Guía Servientrega generada: pedido completo despachado.
 */
export function getOrderShippedEmailHtml(
  data: OrderEmailData,
  trackingCode: string,
  kind: ShipmentKind = 'full',
): string {
  const trackingUrl = servientregaTrackingUrl(trackingCode);

  const intro = `Tu pedido <strong style="color:#1C1A17;font-weight:600;">${escapeHtml(data.orderNumber)}</strong> fue despachado.`;

  const mixedNotice = '';

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
      'También puedes revisar el estado de tu pedido cuando quieras desde tu cuenta en LIVI.',
    )}
    ${whatsappClosing(data.orderNumber)}
  `;

  return baseEmailLayout('Tu pedido fue despachado', body);
}
