export function getPasswordResetEmailHtml(
  firstName: string,
  resetUrl: string,
): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#1B1919;border-radius:8px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;text-align:center;border-bottom:1px solid #3A3636;">
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#CCB377;letter-spacing:2px;font-family:Georgia,'Times New Roman',serif;">
                NonDecants
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 16px;font-size:22px;color:#FFFFFF;font-weight:600;">
                Restablecer contrase&ntilde;a
              </h2>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#A09A9A;">
                Hola <strong style="color:#FFFFFF;">${firstName}</strong>, recibimos una solicitud
                para restablecer la contrase&ntilde;a de tu cuenta en NonDecants.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 32px;">
                    <a href="${resetUrl}"
                       style="display:inline-block;padding:14px 40px;background-color:#CCB377;color:#1B1919;font-size:14px;font-weight:700;text-decoration:none;border-radius:6px;letter-spacing:1px;text-transform:uppercase;">
                      Restablecer contrase&ntilde;a
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;font-size:13px;color:#A09A9A;line-height:1.5;">
                Si no puedes hacer clic en el bot&oacute;n, copia y pega este enlace en tu navegador:
              </p>
              <p style="margin:0 0 24px;font-size:12px;color:#CCB377;word-break:break-all;">
                ${resetUrl}
              </p>
              <p style="margin:0;font-size:13px;color:#A09A9A;border-top:1px solid #3A3636;padding-top:20px;">
                Este enlace expira en <strong style="color:#FFFFFF;">1 hora</strong>.
                Si no solicitaste restablecer tu contrase&ntilde;a, ignora este correo.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #3A3636;text-align:center;">
              <p style="margin:0 0 6px;font-size:13px;color:#A09A9A;">
                ¿Dudas? Escríbenos por
                <a href="https://wa.me/593992305463" style="color:#CCB377;text-decoration:none;">WhatsApp 0992305463</a>
                o a
                <a href="mailto:contacto@nondecants.com" style="color:#CCB377;text-decoration:none;">contacto@nondecants.com</a>
              </p>
              <p style="margin:0;font-size:12px;color:#6E6868;">
                NonDecants — Perfumes auténticos, Ecuador
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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
  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#1B1919;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="padding:32px 40px 24px;text-align:center;border-bottom:1px solid #3A3636;">
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#CCB377;letter-spacing:2px;font-family:Georgia,'Times New Roman',serif;">
                NonDecants
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 16px;font-size:22px;color:#FFFFFF;font-weight:600;">
                Tu cuenta entra con Google
              </h2>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#A09A9A;">
                Hola <strong style="color:#FFFFFF;">${firstName}</strong>, pediste restablecer tu
                contrase&ntilde;a, pero tu cuenta se cre&oacute; con Google: no tiene una
                contrase&ntilde;a nuestra que cambiar.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 28px;">
                    <a href="${loginUrl}" style="display:inline-block;padding:14px 32px;background-color:#CCB377;color:#1B1919;text-decoration:none;border-radius:4px;font-size:15px;font-weight:600;">
                      Entrar con Google
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:13px;color:#A09A9A;border-top:1px solid #3A3636;padding-top:20px;">
                Si no fuiste t&uacute;, ignora este correo: tu cuenta sigue protegida por Google.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #3A3636;text-align:center;">
              <p style="margin:0 0 6px;font-size:13px;color:#A09A9A;">
                ¿Dudas? Escríbenos por
                <a href="https://wa.me/593992305463" style="color:#CCB377;text-decoration:none;">WhatsApp 0992305463</a>
                o a
                <a href="mailto:contacto@nondecants.com" style="color:#CCB377;text-decoration:none;">contacto@nondecants.com</a>
              </p>
              <p style="margin:0;font-size:12px;color:#6E6868;">
                NonDecants — Perfumes auténticos, Ecuador
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
