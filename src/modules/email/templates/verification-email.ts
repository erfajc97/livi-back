import {
  baseEmailLayout,
  ctaButton,
  escapeHtml,
  fallbackLink,
  paragraph,
} from './base-layout';

/** Verificación de correo al registrarse. */
export function getVerificationEmailHtml(
  firstName: string,
  verificationUrl: string,
): string {
  const body = `
    ${paragraph(
      `Hola <strong style="color:#1C1A17;font-weight:600;">${escapeHtml(firstName)}</strong>, confirma tu correo
       para activar tu cuenta y comprar con tus datos guardados.`,
    )}
    ${ctaButton('Verificar mi correo', verificationUrl)}
    ${fallbackLink(verificationUrl)}
    ${paragraph(
      `El enlace vence en <strong style="color:#1C1A17;font-weight:600;">24 horas</strong>.
       Si no creaste esta cuenta, puedes ignorar este mensaje.`,
    )}
  `;

  return baseEmailLayout('Confirma tu correo', body, 'Tu cuenta');
}
