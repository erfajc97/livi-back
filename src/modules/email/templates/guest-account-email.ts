export function getGuestAccountEmailHtml(
  firstName: string,
  email: string,
  password: string,
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
                Creamos tu cuenta
              </h2>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#A09A9A;">
                Hola <strong style="color:#FFFFFF;">${firstName}</strong>, gracias por tu compra en NonDecants.
                Para que puedas hacer seguimiento de esta y de tus pr&oacute;ximas &oacute;rdenes,
                creamos una cuenta con tu correo. Estas son tus credenciales:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;background-color:#262323;border-radius:6px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 10px;font-size:13px;color:#A09A9A;">
                      Usuario: <strong style="color:#FFFFFF;">${email}</strong>
                    </p>
                    <p style="margin:0;font-size:13px;color:#A09A9A;">
                      Contrase&ntilde;a temporal:
                      <strong style="color:#CCB377;font-size:16px;letter-spacing:1px;">${password}</strong>
                    </p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 32px;">
                    <a href="${loginUrl}"
                       style="display:inline-block;padding:14px 40px;background-color:#CCB377;color:#1B1919;font-size:14px;font-weight:700;text-decoration:none;border-radius:6px;letter-spacing:1px;text-transform:uppercase;">
                      Ingresar a mi cuenta
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:13px;color:#A09A9A;border-top:1px solid #3A3636;padding-top:20px;line-height:1.5;">
                Te recomendamos cambiar la contrase&ntilde;a desde
                <strong style="color:#FFFFFF;">Mi Cuenta</strong> cuando ingreses.
                Si no hiciste esta compra, ignora este correo.
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
