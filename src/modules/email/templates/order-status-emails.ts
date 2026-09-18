import {
  baseEmailLayout,
  escapeHtml,
  greeting,
  noticeBlock,
  orderFacts,
  paragraph,
  whatsappClosing,
} from './base-layout';
import { OrderEmailData } from '../email.types';

/**
 * M-11 · Pedido cancelado. Antes estos dos estados no avisaban nada: el
 * cliente veía el cambio en el panel y nunca recibía correo.
 */
export function getOrderCancelledEmailHtml(data: OrderEmailData): string {
  const body = `
    ${greeting(data)}
    ${paragraph(
      `Tu pedido <strong style="color:#1C1A17;font-weight:600;">${escapeHtml(data.orderNumber)}</strong>
       quedó cancelado y no será despachado.`,
    )}
    ${noticeBlock(
      `Si el pago ya se había acreditado, escríbenos y coordinamos la devolución.
       Si cancelaste por error, podemos volver a armar el pedido según el stock disponible.`,
    )}
    ${orderFacts(data)}
    ${whatsappClosing(data.orderNumber)}
  `;

  return baseEmailLayout('Pedido cancelado', body);
}

/** M-12 · Pedido retrasado: se avisa antes de que el cliente pregunte. */
export function getOrderDelayedEmailHtml(data: OrderEmailData): string {
  const body = `
    ${greeting(data)}
    ${paragraph(
      `Tu pedido <strong style="color:#1C1A17;font-weight:600;">${escapeHtml(data.orderNumber)}</strong>
       va a tomar un poco más de lo previsto.`,
    )}
    ${noticeBlock(
      `Estamos trabajando para despacharlo lo antes posible y te escribiremos
       en cuanto tenga guía de envío.`,
    )}
    ${orderFacts(data)}
    ${whatsappClosing(data.orderNumber)}
  `;

  return baseEmailLayout('Tu pedido va con retraso', body);
}
