import { OrderEmailItem } from '../email.types';

/**
 * Layout base de marca para todos los correos transaccionales de NonDecants.
 * Negro carbón #1B1919 + dorado #CCB377, títulos en serif.
 * Todo correo al cliente lleva pie con WhatsApp 0992305463 y
 * contacto@nondecants.com (regla de la matriz de mailing).
 */

export const BRAND_NAME = 'NonDecants';
export const BRAND_WHATSAPP = '0992305463';
export const BRAND_WHATSAPP_URL = 'https://wa.me/593992305463';
export const BRAND_CONTACT_EMAIL = 'contacto@nondecants.com';

export function escapeHtml(value: string): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatUsd(amount: number): string {
  return `$${Number(amount || 0).toFixed(2)}`;
}

const SERIF = `Georgia,'Times New Roman',serif`;
const SANS = `'Helvetica Neue',Arial,sans-serif`;

/**
 * Envuelve el contenido de un correo en el layout de marca.
 * `title` es el encabezado serif grande dentro de la tarjeta.
 */
export function baseEmailLayout(title: string, bodyHtml: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:${SANS};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#1B1919;border-radius:8px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;text-align:center;border-bottom:1px solid #3A3636;">
              <h1 style="margin:0;font-size:30px;font-weight:700;color:#CCB377;letter-spacing:2px;font-family:${SERIF};">
                NonDecants
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 20px;font-size:24px;color:#FFFFFF;font-weight:600;font-family:${SERIF};">
                ${title}
              </h2>
              ${bodyHtml}
            </td>
          </tr>
          <!-- Footer: va en TODOS los correos al cliente -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #3A3636;text-align:center;">
              <p style="margin:0 0 6px;font-size:13px;color:#A09A9A;">
                ¿Dudas? Escríbenos por
                <a href="${BRAND_WHATSAPP_URL}" style="color:#CCB377;text-decoration:none;">WhatsApp ${BRAND_WHATSAPP}</a>
                o a
                <a href="mailto:${BRAND_CONTACT_EMAIL}" style="color:#CCB377;text-decoration:none;">${BRAND_CONTACT_EMAIL}</a>
              </p>
              <p style="margin:0;font-size:12px;color:#6E6868;">
                NonDecants — Perfumes auténticos, Ecuador
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Botón dorado principal. */
export function ctaButton(label: string, url: string): string {
  return `
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:8px 0 28px;">
        <a href="${url}"
           style="display:inline-block;padding:14px 40px;background-color:#CCB377;color:#1B1919;font-size:14px;font-weight:700;text-decoration:none;border-radius:6px;letter-spacing:1px;text-transform:uppercase;font-family:${SANS};">
          ${label}
        </a>
      </td>
    </tr>
  </table>`;
}

/** Tabla de productos del pedido (versión oscura de marca). */
export function itemsTable(items: OrderEmailItem[]): string {
  const rows = items
    .map((i) => {
      const detail = i.ml ? ` (${i.ml} ml)` : '';
      const backorder =
        i.bajoPedidoQuantity && i.bajoPedidoQuantity > 0
          ? ` <span style="color:#CCB377;font-size:12px;">· ${i.bajoPedidoQuantity} bajo pedido</span>`
          : '';
      return `<tr>
        <td style="padding:10px 8px;border-bottom:1px solid #3A3636;font-size:14px;color:#FFFFFF;">
          ${i.quantity}x ${escapeHtml(i.name)}${detail}${backorder}
        </td>
        <td style="padding:10px 8px;border-bottom:1px solid #3A3636;font-size:14px;color:#FFFFFF;text-align:right;white-space:nowrap;">
          ${formatUsd(i.price * i.quantity)}
        </td>
      </tr>`;
    })
    .join('');

  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-collapse:collapse;">
    <thead>
      <tr>
        <th style="text-align:left;padding:8px;border-bottom:2px solid #CCB377;font-size:12px;color:#CCB377;letter-spacing:1px;text-transform:uppercase;">Producto</th>
        <th style="text-align:right;padding:8px;border-bottom:2px solid #CCB377;font-size:12px;color:#CCB377;letter-spacing:1px;text-transform:uppercase;">Precio</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
}

/** Bloque de totales (subtotal, envío, recargos, descuento, total). */
export function totalsTable(data: {
  subtotal: number;
  deliveryCost?: number;
  payphoneSurcharge?: number;
  couponDiscount?: number;
  total: number;
}): string {
  const line = (label: string, value: string) => `
    <tr>
      <td style="padding:4px 8px;font-size:13px;color:#A09A9A;">${label}</td>
      <td style="padding:4px 8px;font-size:13px;color:#FFFFFF;text-align:right;">${value}</td>
    </tr>`;

  let rows = line('Subtotal', formatUsd(data.subtotal));
  if (data.deliveryCost != null) {
    rows += line(
      'Envío',
      data.deliveryCost > 0 ? formatUsd(data.deliveryCost) : 'Gratis',
    );
  }
  if (data.couponDiscount && data.couponDiscount > 0) {
    rows += line('Descuento', `-${formatUsd(data.couponDiscount)}`);
  }
  if (data.payphoneSurcharge && data.payphoneSurcharge > 0) {
    rows += line('Recargo Payphone (6%)', formatUsd(data.payphoneSurcharge));
  }
  rows += `
    <tr>
      <td style="padding:10px 8px 0;font-size:15px;font-weight:700;color:#CCB377;border-top:1px solid #3A3636;">Total</td>
      <td style="padding:10px 8px 0;font-size:15px;font-weight:700;color:#CCB377;text-align:right;border-top:1px solid #3A3636;">${formatUsd(data.total)}</td>
    </tr>`;

  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border-collapse:collapse;">
    ${rows}
  </table>`;
}

/** Bloque de dirección de envío. */
export function shippingBlock(data: {
  deliveryMethod?: string;
  shippingAddress?: string;
  shippingCity?: string;
}): string {
  if (!data.shippingAddress && !data.deliveryMethod) return '';
  const address = [data.shippingAddress, data.shippingCity]
    .filter(Boolean)
    .map(escapeHtml)
    .join(', ');
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;background-color:#262323;border-radius:6px;">
    <tr>
      <td style="padding:16px 20px;">
        ${data.deliveryMethod ? `<p style="margin:0 0 6px;font-size:12px;color:#CCB377;letter-spacing:1px;text-transform:uppercase;">Entrega — ${escapeHtml(data.deliveryMethod)}</p>` : ''}
        ${address ? `<p style="margin:0;font-size:14px;color:#FFFFFF;line-height:1.5;">${address}</p>` : ''}
      </td>
    </tr>
  </table>`;
}

/** Aviso dorado (recuadro) para mensajes importantes. */
export function noticeBlock(html: string): string {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;background-color:#262323;border-left:3px solid #CCB377;border-radius:4px;">
    <tr>
      <td style="padding:16px 20px;font-size:14px;color:#FFFFFF;line-height:1.6;">
        ${html}
      </td>
    </tr>
  </table>`;
}

export function paragraph(html: string): string {
  return `<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#A09A9A;">${html}</p>`;
}
