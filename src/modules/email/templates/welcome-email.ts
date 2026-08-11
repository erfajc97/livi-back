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
      `Hola <strong style="color:#FFFFFF;">${escapeHtml(firstName || 'Cliente')}</strong>,
      bienvenido a NonDecants. Tu cuenta ya está lista.`,
    )}
    ${paragraph(
      `Descubre perfumes auténticos al mejor precio: prueba en decant antes de comprometerte
      con el frasco entero, y si no está en nuestro catálogo, lo conseguimos por ti.`,
    )}
    ${ctaButton('Descubrir perfumes', shopUrl)}
    ${paragraph(
      `Desde tu cuenta puedes seguir tus pedidos y guardar tus datos para compras más rápidas.`,
    )}
  `;

  return baseEmailLayout('Bienvenido a NonDecants', body);
}
