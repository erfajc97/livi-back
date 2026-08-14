import {
  baseEmailLayout,
  ctaButton,
  dataRows,
  escapeHtml,
  noticeBlock,
  paragraph,
} from './base-layout';

/**
 * Aviso al cliente cuando el equipo le asigna una contraseña nueva desde el
 * panel (soporte por WhatsApp, cuentas sin acceso al correo, etc.).
 *
 * Lleva la contraseña en claro porque es el único canal en el que el cliente
 * puede recibirla: se envía una sola vez y el texto insiste en cambiarla.
 */
export function getAdminPasswordResetEmailHtml(
  firstName: string,
  email: string,
  password: string,
  loginUrl: string,
): string {
  const body = `
    ${paragraph(
      `Hola <strong style="color:#1C1A17;font-weight:600;">${escapeHtml(firstName)}</strong>, a pedido tuyo
       generamos una contraseña nueva para tu cuenta. Ya puedes entrar con ella.`,
    )}
    ${dataRows([
      { label: 'Correo', value: email },
      { label: 'Contraseña nueva', value: password },
    ])}
    ${noticeBlock(
      'Cámbiala apenas entres, desde <strong>Mi cuenta</strong>. Si no pediste este cambio, escríbenos.',
    )}
    ${ctaButton('Entrar a mi cuenta', loginUrl)}
  `;

  return baseEmailLayout('Tu contraseña fue actualizada', body, 'Seguridad');
}
