import {
  baseEmailLayout,
  escapeHtml,
  paragraph,
} from './base-layout';

/**
 * M-08 · Servientrega marca "entregado" → carta elegante de agradecimiento.
 * Asunto: "Tu perfume ha llegado". Texto aprobado de la hoja de ruta
 * (sección "M-08 · Carta de agradecimiento"), usado verbatim.
 */
export function getOrderDeliveredEmailHtml(customerName: string): string {
  const firstName = escapeHtml((customerName || '').split(' ')[0] || 'Cliente');

  const body = `
    ${paragraph(`Hola <strong style="color:#1C1A17;font-weight:600;">${firstName}</strong>,`)}
    ${paragraph(`Tu pedido ya está en tus manos, y eso nos hace muy felices.`)}
    ${paragraph(
      `Detrás de cada envío hay una búsqueda: perfumes auténticos, verificados uno a uno
      y preparados con cuidado para que los vivas sin atajos ni dudas.`,
    )}
    ${paragraph(`Gracias por confiar en nosotros para acompañarte en ese ritual.`)}
    ${paragraph(`Esperamos que cada aroma te encuentre en el momento justo.`)}
    ${paragraph(
      `Si algo no fue como esperabas, escríbenos por WhatsApp
      (<a href="https://wa.me/593992305463" style="color:#1C1A17;text-decoration:underline;">0992305463</a>)
      o a <a href="mailto:contacto@nondecants.com" style="color:#1C1A17;text-decoration:underline;">contacto@nondecants.com</a>
      — estamos para ti.`,
    )}
    <p style="margin:26px 0 0;font-size:17px;line-height:1.6;color:#1C1A17;font-family:Georgia,serif;font-style:italic;">
      Con aprecio,<br>El equipo de NonDecants
    </p>
  `;

  return baseEmailLayout('Tu perfume ha llegado', body);
}
