import {
  baseEmailLayout,
  escapeHtml,
  paragraph,
} from './base-layout';

/**
 * M-08 · Servientrega marca "entregado" → carta elegante de agradecimiento.
 */
export function getOrderDeliveredEmailHtml(customerName: string): string {
  const firstName = escapeHtml((customerName || '').split(' ')[0] || 'Cliente');

  const body = `
    ${paragraph(`Hola <strong style="color:#231815;font-weight:600;">${firstName}</strong>,`)}
    ${paragraph(`Tu pedido ya está en tus manos, y eso nos hace muy felices.`)}
    ${paragraph(
      `Detrás de cada envío hay un taller: cuero genuino, costuras verificadas una a una
      y piezas preparadas con cuidado para acompañarte por años, no por etapas.`,
    )}
    ${paragraph(`Gracias por confiar en nosotros para acompañarte en esta etapa.`)}
    ${paragraph(`Esperamos que tu pieza LIVI te encuentre en el momento justo.`)}
    ${paragraph(
      `Si algo no fue como esperabas, escríbenos por WhatsApp
      (<a href="https://wa.me/593992305463" style="color:#231815;text-decoration:underline;">0992305463</a>)
      o a <a href="mailto:contacto@livi.ec" style="color:#231815;text-decoration:underline;">contacto@livi.ec</a>
      — estamos para ti.`,
    )}
    <p style="margin:26px 0 0;font-size:17px;line-height:1.6;color:#231815;font-family:Georgia,serif;font-style:italic;">
      Con aprecio,<br>El equipo de LIVI
    </p>
  `;

  return baseEmailLayout('Tu pedido ha llegado', body);
}
