import {
  baseEmailLayout,
  ctaButton,
  escapeHtml,
  paragraph,
} from './base-layout';

/**
 * M-10 · Cuenta creada → bienvenida.
 * `shopUrl` apunta al home de la tienda.
 */
export function getWelcomeEmailHtml(
  firstName: string,
  shopUrl: string,
): string {
  const body = `
    ${paragraph(
      `Hola <strong style="color:#231815;font-weight:600;">${escapeHtml(firstName || 'Cliente')}</strong>,
      bienvenido a LIVI. Tu cuenta ya está lista.`,
    )}
    ${paragraph(
      `Descubre pañaleras y mochilas de cuero premium, hechas a mano en Ecuador:
      piezas pensadas para tu vida, no solo para la etapa.`,
    )}
    ${ctaButton('Descubrir la tienda', shopUrl)}
    ${paragraph(
      `Desde tu cuenta puedes seguir tus pedidos y guardar tus datos para compras más rápidas.`,
    )}
  `;

  return baseEmailLayout('Bienvenido a LIVI', body);
}
