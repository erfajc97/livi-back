import {
  baseEmailLayout,
  ctaButton,
  escapeHtml,
  itemsTable,
  paragraph,
} from './base-layout';
import { OrderEmailItem } from '../email.types';

/**
 * M-09 · Carrito abandonado → recordatorio a los 5 minutos del abandono.
 * Solo clientes registrados (el scheduler del módulo cart lo garantiza).
 */
export function getAbandonedCartEmailHtml(
  firstName: string,
  items: OrderEmailItem[],
  cartUrl: string,
): string {
  const body = `
    ${paragraph(
      `Hola <strong style="color:#231815;font-weight:600;">${escapeHtml(firstName || 'Cliente')}</strong>,
      dejaste estas piezas en tu carrito. Todavía están disponibles — completa tu compra
      antes de que se agoten:`,
    )}
    ${itemsTable(items)}
    ${ctaButton('Volver a mi carrito', cartUrl)}
    ${paragraph(
      `Si ya completaste tu compra, ignora este correo.`,
    )}
  `;

  return baseEmailLayout('Tu carrito te espera', body);
}
