import {
  baseEmailLayout,
  escapeHtml,
  itemsTable,
  paragraph,
  shippingBlock,
  totalsTable,
} from './base-layout';
import { OrderEmailData } from '../email.types';

/**
 * M-13 · Cualquier pedido nuevo → alerta interna a nondecants@gmail.com
 * con el detalle completo del pedido.
 */
export function getAdminNewOrderEmailHtml(data: OrderEmailData): string {
  const body = `
    ${paragraph(
      `Nueva orden <strong style="color:#1C1A17;font-weight:600;">${escapeHtml(data.orderNumber)}</strong>
      generada en la tienda.`,
    )}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;background-color:#F3EBDB;border-radius:6px;">
      <tr>
        <td style="padding:16px 20px;font-size:14px;color:#1C1A17;font-weight:600;line-height:1.7;">
          <strong>Cliente:</strong> ${escapeHtml(data.customerName || '—')}<br>
          <strong>Email:</strong> ${escapeHtml(data.customerEmail || '—')}<br>
          <strong>Teléfono:</strong> ${escapeHtml(data.customerPhone || '—')}<br>
          <strong>Método de pago:</strong> ${escapeHtml(data.paymentMethod || '—')}
        </td>
      </tr>
    </table>
    ${itemsTable(data.items)}
    ${totalsTable(data)}
    ${shippingBlock(data)}
    ${paragraph(
      data.paymentMethod === 'TRANSFERENCIA'
        ? `Pago por transferencia: valida el comprobante desde el panel de administración.`
        : `Revisa y gestiona el pedido desde el panel de administración.`,
    )}
  `;

  return baseEmailLayout(`Nueva orden ${escapeHtml(data.orderNumber)}`, body);
}
