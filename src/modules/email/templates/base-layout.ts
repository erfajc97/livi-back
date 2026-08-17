import {
  deliveryMethodLabel,
  formatOrderDate,
  OrderEmailData,
  OrderEmailItem,
  paymentMethodLabel,
} from '../email.types';

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
/** Sitio público: respaldo para el logo cuando FRONTEND_URL no sirve. */
export const PUBLIC_SITE_URL = 'https://nondecants.com';
/** El logo oficial vive en el `public/` del front. */
export const BRAND_LOGO_PATH = '/logonondecants.png';

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

// La serif del sitio (Cormorant Garamond) va primero y se carga por webfont:
// Apple Mail, iOS y Outlook para Mac la respetan y el correo queda con la misma
// letra curva de la web. Gmail ignora webfonts y cae a Georgia, que es la que
// más se le parece de las instaladas en todos lados.
const SERIF = `'Cormorant Garamond','Cormorant',Georgia,'Times New Roman',serif`;
const SANS = `'DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif`;

/** Carga de las fuentes de marca. Va en el <head> de cada correo. */
const FONT_IMPORT = `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=DM+Sans:wght@400;500;600&display=swap');
  </style>`;

/**
 * URL absoluta del logo. Los clientes de correo no resuelven rutas relativas,
 * así que sale de `MAIL_LOGO_URL` o, por defecto, del front público.
 * `FRONTEND_URL` puede traer varios orígenes separados por coma (CORS): manda
 * el primero, igual que en EmailService.
 */
function brandLogoUrl(): string {
  const explicit = (process.env.MAIL_LOGO_URL ?? '').trim();
  if (explicit) return explicit;
  const front = (process.env.FRONTEND_URL ?? '')
    .split(',')[0]
    .trim()
    .replace(/\/+$/, '');
  // localhost no sirve como fuente del logo: el correo se abre en el cliente,
  // no en la máquina que lo generó, y la imagen sale rota. Con FRONTEND_URL mal
  // configurado (o sin configurar) se cae al sitio público antes que a texto.
  const usableFront = front && !/^https?:\/\/(localhost|127\.0\.0\.1)/i.test(front)
    ? front
    : PUBLIC_SITE_URL;
  return `${usableFront}${BRAND_LOGO_PATH}`;
}

/**
 * Cabecera de marca: el logo, no el nombre escrito. Si no hay URL configurada
 * cae al texto para no dejar el correo decapitado.
 */
function brandHeader(): string {
  const logo = brandLogoUrl();
  if (!logo) {
    return `<span style="font-family:${SERIF};font-size:22px;letter-spacing:5px;text-transform:uppercase;color:${C.ink};">${BRAND_NAME}</span>`;
  }
  // `alt` con el nombre: si el cliente bloquea imágenes, la marca sigue ahí.
  return `<img src="${logo}" alt="${BRAND_NAME}" width="180" style="display:block;width:180px;max-width:60%;height:auto;border:0;outline:none;text-decoration:none;">`;
}

/** Rótulo pequeño en versalitas, el mismo recurso que el sitio. */
export function eyebrow(text: string): string {
  return `<p style="margin:0 0 10px;font-family:${SANS};font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:${C.muted};">${text}</p>`;
}

/**
 * Título de sección: serif de marca sobre filete dorado. Los rótulos en gris
 * diminuto se perdían y el correo se leía como un bloque plano; cada sección
 * (pedido, totales, entrega) tiene que verse de un vistazo.
 */
export function sectionTitle(text: string): string {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 12px;">
    <tr>
      <td style="padding:0 0 6px;font-family:${SERIF};font-size:20px;line-height:1.25;font-weight:600;color:${C.ink};border-bottom:2px solid ${C.gold};">
        ${text}
      </td>
    </tr>
  </table>`;
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
  ${FONT_IMPORT}
</head>
<body style="margin:0;padding:0;background-color:${C.page};font-family:${SANS};-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.page};">
    <tr>
      <td align="center" style="padding:32px 16px 40px;">

        <!-- Marca -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;">
          <tr>
            <td align="center" style="padding:8px 0 22px;">
              ${brandHeader()}
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
              <h1 style="margin:0 0 8px;font-family:${SERIF};font-size:34px;line-height:1.15;font-weight:600;color:${C.ink};">
                ${title}
              </h1>
              <!-- Filete corto bajo el titular: separa el título del cuerpo -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
                <tr><td style="width:56px;height:2px;line-height:2px;font-size:0;background-color:${C.gold};">&nbsp;</td></tr>
              </table>
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

/**
 * Detalle del pedido: Producto · Cantidad · Precio, con hairlines.
 *
 * Las tres columnas llevan padding lateral propio; sin él, el nombre largo y
 * el precio se tocaban ("Turathi electric$13.00") porque en correo no hay
 * `gap` y las celdas se pegan.
 */
export function itemsTable(items: OrderEmailItem[]): string {
  const headCell = (text: string, align: 'left' | 'center' | 'right') =>
    `<th style="padding:0 0 10px;font-family:${SANS};font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:${C.muted};text-align:${align};border-bottom:1px solid ${C.line};">${text}</th>`;

  const rows = items
    .map((i) => {
      const detail = i.ml ? `${i.ml} ml` : 'Botella completa';
      const backorder =
        i.bajoPedidoQuantity && i.bajoPedidoQuantity > 0
          ? `<br><span style="font-size:12px;color:${C.gold};">${i.bajoPedidoQuantity} bajo pedido</span>`
          : '';
      return `<tr>
        <td style="padding:14px 12px 14px 0;border-bottom:1px solid ${C.line};font-family:${SANS};font-size:14px;line-height:1.5;color:${C.ink};vertical-align:top;">
          <span style="font-family:${SERIF};font-size:16px;">${escapeHtml(i.name)}</span><br>
          <span style="font-size:12px;color:${C.muted};">${detail}</span>${backorder}
        </td>
        <td style="padding:14px 12px;border-bottom:1px solid ${C.line};font-family:${SANS};font-size:14px;color:${C.soft};text-align:center;white-space:nowrap;vertical-align:top;">
          ${i.quantity}
        </td>
        <td style="padding:14px 0 14px 12px;border-bottom:1px solid ${C.line};font-family:${SANS};font-size:14px;color:${C.ink};text-align:right;white-space:nowrap;vertical-align:top;">
          ${formatUsd(i.price * i.quantity)}
        </td>
      </tr>`;
    })
    .join('');

  return `
  ${sectionTitle('Tu pedido')}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px;border-collapse:collapse;table-layout:auto;">
    <tr>
      ${headCell('Producto', 'left')}
      ${headCell('Cant.', 'center')}
      ${headCell('Precio', 'right')}
    </tr>
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
  // Cupón y recargo solo aparecen si los hubo: una línea en $0.00 hace dudar
  // al cliente de si le cobraron algo.
  if (data.couponDiscount && data.couponDiscount > 0) {
    rows += line('Cupón aplicado', `-${formatUsd(data.couponDiscount)}`);
  }
  if (data.payphoneSurcharge && data.payphoneSurcharge > 0) {
    rows += line('Fee de Payphone (6%)', formatUsd(data.payphoneSurcharge));
  }
  if (data.deliveryCost != null) {
    rows += line(
      'Gastos de envío',
      data.deliveryCost > 0 ? formatUsd(data.deliveryCost) : 'Gratis',
    );
  }
  rows += `
    <tr>
      <td style="padding:14px 0 0;border-top:1px solid ${C.line};font-family:${SERIF};font-size:18px;font-weight:600;color:${C.ink};">Total</td>
      <td style="padding:14px 0 0;border-top:1px solid ${C.line};font-family:${SERIF};font-size:26px;font-weight:600;color:${C.ink};text-align:right;">${formatUsd(data.total)}</td>
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
  // El método llega como código; en el correo va su nombre real.
  const method = deliveryMethodLabel(data.deliveryMethod);
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;border:1px solid ${C.line};">
    <tr>
      <td style="padding:18px 20px;">
        ${sectionTitle('Dirección de entrega')}
        ${method ? `<p style="margin:0 0 6px;font-family:${SANS};font-size:13px;line-height:1.6;color:${C.soft};">${escapeHtml(method)}</p>` : ''}
        ${address ? `<p style="margin:0;font-family:${SANS};font-size:14px;line-height:1.6;color:${C.ink};">${address}</p>` : ''}
      </td>
    </tr>
  </table>`;
}

/**
 * Botón de WhatsApp para el cierre de los correos de pedido: es el canal por
 * el que el cliente realmente escribe, y buscar el número en el pie no cuenta.
 */
export function whatsappButton(
  label = 'Escríbenos por WhatsApp',
  message?: string,
): string {
  const url = message
    ? `${BRAND_WHATSAPP_URL}?text=${encodeURIComponent(message)}`
    : BRAND_WHATSAPP_URL;
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 8px;">
    <tr>
      <td align="center">
        <a href="${url}"
           style="display:inline-block;padding:14px 34px;background-color:${C.card};border:1px solid ${C.ink};color:${C.ink};font-family:${SANS};font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;text-decoration:none;">
          ${label}
        </a>
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

/**
 * Saludo con nombre y apellido. El cliente escribió su nombre completo en el
 * checkout; cortarlo al primero hacía sonar el correo a plantilla genérica.
 */
export function greeting(data: OrderEmailData): string {
  const name = escapeHtml((data.customerName || '').trim() || 'Cliente');
  return paragraph(
    `Hola <strong style="color:${C.ink};font-weight:600;">${name}</strong>,`,
  );
}

/** Bloque "Detalles del pedido": número, fecha de creación y forma de pago. */
export function orderFacts(data: OrderEmailData): string {
  const rows: { label: string; value: string }[] = [
    { label: 'Pedido', value: data.orderNumber },
  ];
  const created = formatOrderDate(data.createdAt);
  if (created) rows.push({ label: 'Fecha de creación', value: created });
  const payment = paymentMethodLabel(data.paymentMethod);
  if (payment) rows.push({ label: 'Método de pago', value: payment });
  return `${sectionTitle('Detalles del pedido')}${dataRows(rows)}`;
}

/** Cierre estándar de los correos de pedido: consulta por WhatsApp. */
export function whatsappClosing(orderNumber: string): string {
  return `
    ${paragraph('Cualquier duda no dudes en consultarnos por WhatsApp:')}
    ${whatsappButton(
      'Escríbenos por WhatsApp',
      `Hola, tengo una consulta sobre mi pedido ${orderNumber}`,
    )}`;
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
