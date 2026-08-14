import { OrderEmailItem } from '../email.types';

/**
 * Layout base de marca para todos los correos transaccionales de NonDecants.
 *
 * Sigue la identidad Atelier de la tienda: fondo marfil, tinta carbón, dorado
 * como acento y titulares en serif. Antes los correos eran oscuros —de la etapa
 * anterior de la marca— y al lado del sitio parecían de otra empresa.
 *
 * Reglas de correo HTML que condicionan el código de acá:
 * tablas en vez de flex/grid, estilos en línea (Gmail descarta el <style>),
 * ancho fijo de 600 px y colores en hex de seis dígitos.
 *
 * Todo correo al cliente lleva pie con WhatsApp 0992305463 y
 * contacto@nondecants.com (regla de la matriz de mailing).
 */

export const BRAND_NAME = 'NonDecants';
export const BRAND_WHATSAPP = '0992305463';
export const BRAND_WHATSAPP_URL = 'https://wa.me/593992305463';
export const BRAND_CONTACT_EMAIL = 'contacto@nondecants.com';

/** Paleta Atelier, la misma del sitio. */
const C = {
  page: '#EFEAE3', // marfil del fondo
  card: '#FFFDFA', // tarjeta, un punto más clara que el fondo
  ink: '#1C1A17', // texto principal
  soft: '#56504A', // párrafos
  muted: '#8A8278', // rótulos y notas al pie
  line: '#E5DED4', // hairlines
  gold: '#CCB377', // acento
  goldSoft: '#F3EBDB', // fondo de bloques destacados
};

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

// Cormorant no existe en los clientes de correo: Georgia es la serif que más
// se le parece y está en todos lados.
const SERIF = `Georgia,'Times New Roman',serif`;
const SANS = `'Helvetica Neue',Helvetica,Arial,sans-serif`;

/** Rótulo pequeño en versalitas, el mismo recurso que el sitio. */
export function eyebrow(text: string): string {
  return `<p style="margin:0 0 10px;font-family:${SANS};font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:${C.muted};">${text}</p>`;
}

/**
 * Envuelve el contenido en el layout de marca.
 * `title` es el titular serif de la tarjeta; `eyebrowText` el rótulo de arriba.
 */
export function baseEmailLayout(
  title: string,
  bodyHtml: string,
  eyebrowText?: string,
): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:${C.page};font-family:${SANS};-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.page};">
    <tr>
      <td align="center" style="padding:32px 16px 40px;">

        <!-- Marca -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;">
          <tr>
            <td align="center" style="padding:8px 0 22px;">
              <span style="font-family:${SERIF};font-size:22px;letter-spacing:5px;text-transform:uppercase;color:${C.ink};">
                NonDecants
              </span>
            </td>
          </tr>
        </table>

        <!-- Tarjeta -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;background-color:${C.card};border:1px solid ${C.line};">
          <!-- Filete dorado superior -->
          <tr><td style="height:3px;line-height:3px;font-size:0;background-color:${C.gold};">&nbsp;</td></tr>
          <tr>
            <td style="padding:40px 44px 44px;">
              ${eyebrowText ? eyebrow(eyebrowText) : ''}
              <h1 style="margin:0 0 22px;font-family:${SERIF};font-size:30px;line-height:1.15;font-weight:400;color:${C.ink};">
                ${title}
              </h1>
              ${bodyHtml}
            </td>
          </tr>
        </table>

        <!-- Pie: va en TODOS los correos al cliente -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;">
          <tr>
            <td align="center" style="padding:26px 24px 0;">
              <p style="margin:0 0 8px;font-family:${SANS};font-size:13px;line-height:1.6;color:${C.soft};">
                ¿Dudas? Escríbenos por
                <a href="${BRAND_WHATSAPP_URL}" style="color:${C.ink};text-decoration:underline;">WhatsApp ${BRAND_WHATSAPP}</a>
                o a
                <a href="mailto:${BRAND_CONTACT_EMAIL}" style="color:${C.ink};text-decoration:underline;">${BRAND_CONTACT_EMAIL}</a>
              </p>
              <p style="margin:0;font-family:${SANS};font-size:12px;line-height:1.6;color:${C.muted};">
                ${BRAND_NAME} — Perfumes auténticos, Ecuador
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

/**
 * Botón principal. Tinta con texto marfil, como en la tienda; el `border` en el
 * mismo tono evita el borde azul que Outlook agrega por su cuenta.
 */
export function ctaButton(label: string, url: string): string {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 28px;">
    <tr>
      <td align="center">
        <a href="${url}"
           style="display:inline-block;padding:15px 40px;background-color:${C.ink};border:1px solid ${C.ink};color:${C.card};font-family:${SANS};font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;text-decoration:none;">
          ${label}
        </a>
      </td>
    </tr>
  </table>`;
}

/** Enlace secundario, para cuando el botón no se puede tocar. */
export function fallbackLink(url: string): string {
  return `<p style="margin:0 0 24px;font-family:${SANS};font-size:12px;line-height:1.6;color:${C.muted};word-break:break-all;">
    Si el botón no funciona, copia este enlace: <span style="color:${C.soft};">${url}</span>
  </p>`;
}

/** Detalle del pedido: una línea por producto, con hairlines. */
export function itemsTable(items: OrderEmailItem[]): string {
  const rows = items
    .map((i) => {
      const detail = i.ml ? `${i.ml} ml` : 'Botella completa';
      const backorder =
        i.bajoPedidoQuantity && i.bajoPedidoQuantity > 0
          ? `<span style="color:${C.gold};"> · ${i.bajoPedidoQuantity} bajo pedido</span>`
          : '';
      return `<tr>
        <td style="padding:14px 0;border-bottom:1px solid ${C.line};font-family:${SANS};font-size:14px;line-height:1.5;color:${C.ink};">
          <span style="font-family:${SERIF};font-size:16px;">${escapeHtml(i.name)}</span><br>
          <span style="font-size:12px;color:${C.muted};">${i.quantity} × ${detail}${backorder}</span>
        </td>
        <td style="padding:14px 0;border-bottom:1px solid ${C.line};font-family:${SANS};font-size:14px;color:${C.ink};text-align:right;white-space:nowrap;vertical-align:top;">
          ${formatUsd(i.price * i.quantity)}
        </td>
      </tr>`;
    })
    .join('');

  return `
  ${eyebrow('Tu pedido')}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px;border-collapse:collapse;border-top:1px solid ${C.line};">
    ${rows}
  </table>`;
}

/** Totales: etiquetas discretas y el total en serif, que es lo que se busca. */
export function totalsTable(data: {
  subtotal: number;
  deliveryCost?: number;
  payphoneSurcharge?: number;
  couponDiscount?: number;
  total: number;
}): string {
  const line = (label: string, value: string) => `
    <tr>
      <td style="padding:5px 0;font-family:${SANS};font-size:13px;color:${C.muted};">${label}</td>
      <td style="padding:5px 0;font-family:${SANS};font-size:13px;color:${C.soft};text-align:right;">${value}</td>
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
      <td style="padding:14px 0 0;border-top:1px solid ${C.line};font-family:${SANS};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${C.muted};">Total</td>
      <td style="padding:14px 0 0;border-top:1px solid ${C.line};font-family:${SERIF};font-size:22px;color:${C.ink};text-align:right;">${formatUsd(data.total)}</td>
    </tr>`;

  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;border-collapse:collapse;">
    ${rows}
  </table>`;
}

/** Dirección y forma de entrega. */
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
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;border:1px solid ${C.line};">
    <tr>
      <td style="padding:18px 20px;">
        ${data.deliveryMethod ? eyebrow(`Entrega — ${escapeHtml(data.deliveryMethod)}`) : ''}
        ${address ? `<p style="margin:0;font-family:${SANS};font-size:14px;line-height:1.6;color:${C.ink};">${address}</p>` : ''}
      </td>
    </tr>
  </table>`;
}

/** Recuadro para lo que no se puede pasar por alto. */
export function noticeBlock(html: string): string {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 26px;background-color:${C.goldSoft};">
    <tr>
      <td style="width:3px;background-color:${C.gold};">&nbsp;</td>
      <td style="padding:16px 20px;font-family:${SANS};font-size:14px;line-height:1.65;color:${C.ink};">
        ${html}
      </td>
    </tr>
  </table>`;
}

export function paragraph(html: string): string {
  return `<p style="margin:0 0 20px;font-family:${SANS};font-size:15px;line-height:1.7;color:${C.soft};">${html}</p>`;
}

/** Frase de cierre en serif, para las despedidas de marca. */
export function signature(html: string): string {
  return `<p style="margin:28px 0 0;font-family:${SERIF};font-size:16px;line-height:1.6;color:${C.ink};">${html}</p>`;
}

/** Dato suelto en dos columnas (pedido, fecha, método de pago…). */
export function dataRows(rows: { label: string; value: string }[]): string {
  const body = rows
    .map(
      (r) => `<tr>
        <td style="padding:7px 0;font-family:${SANS};font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:${C.muted};white-space:nowrap;">${escapeHtml(r.label)}</td>
        <td style="padding:7px 0;font-family:${SANS};font-size:14px;color:${C.ink};text-align:right;">${escapeHtml(r.value)}</td>
      </tr>`,
    )
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 26px;border-collapse:collapse;">${body}</table>`;
}
