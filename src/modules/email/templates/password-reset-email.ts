import {
  baseEmailLayout,
  ctaButton,
  escapeHtml,
  fallbackLink,
  noticeBlock,
  paragraph,
} from './base-layout';

/** Enlace para elegir una contraseña nueva. */
export function getPasswordResetEmailHtml(
  firstName: string,
  resetUrl: string,
): string {
  const body = `
    ${paragraph(
      `Hola <strong style="color:#1C1A17;font-weight:600;">${escapeHtml(firstName)}</strong>, recibimos una
       solicitud para cambiar la contraseña de tu cuenta.`,
    )}
    ${ctaButton('Elegir contraseña nueva', resetUrl)}
    ${fallbackLink(resetUrl)}
    ${noticeBlock(
      `El enlace vence en <strong>1 hora</strong>. Si no lo pediste tú, ignora este correo:
       tu contraseña actual sigue funcionando.`,
    )}
  `;

  return baseEmailLayout('Restablecer contraseña', body, 'Seguridad');
}

/**
 * Aviso para cuentas creadas con Google: no hay contraseña que restablecer.
 *
 * Sin esto, quien entró con Google pedía el enlace y no le llegaba nada —el
 * flujo lo descarta a propósito— y se quedaba esperando sin saber por qué.
 */
export function getPasswordResetGoogleNoticeHtml(
  firstName: string,
  loginUrl: string,
): string {
  const body = `
    ${paragraph(
      `Hola <strong style="color:#1C1A17;font-weight:600;">${escapeHtml(firstName)}</strong>, pediste restablecer
       tu contraseña, pero tu cuenta se creó con Google: no tiene una contraseña nuestra que cambiar.`,
    )}
    ${ctaButton('Entrar con Google', loginUrl)}
    ${paragraph(
      'Si no fuiste tú, ignora este correo: tu cuenta sigue protegida por Google.',
    )}
  `;

  return baseEmailLayout('Tu cuenta entra con Google', body, 'Seguridad');
}
