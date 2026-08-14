import {
  baseEmailLayout,
  ctaButton,
  dataRows,
  escapeHtml,
  noticeBlock,
  paragraph,
} from './base-layout';

/**
 * Credenciales de la cuenta que se abre sola al comprar como invitado.
 * Lleva la contraseña temporal, así que se envía una sola vez.
 */
export function getGuestAccountEmailHtml(
  firstName: string,
  email: string,
  password: string,
  loginUrl: string,
): string {
  const body = `
    ${paragraph(
      `Hola <strong style="color:#1C1A17;font-weight:600;">${escapeHtml(firstName)}</strong>, con tu compra te
       abrimos una cuenta para que sigas tu pedido y guardes tus direcciones para la próxima.`,
    )}
    ${dataRows([
      { label: 'Correo', value: email },
      { label: 'Contraseña temporal', value: password },
    ])}
    ${noticeBlock(
      'Cámbiala apenas entres, desde <strong>Mi cuenta</strong>. Es temporal y la envía este correo.',
    )}
    ${ctaButton('Entrar a mi cuenta', loginUrl)}
  `;

  return baseEmailLayout('Tu cuenta está lista', body, 'Bienvenido');
}
