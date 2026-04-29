export function getNewsletterEmailHtml(options: {
  heading: string;
  body: string;
  ctaText?: string;
  ctaUrl?: string;
  imageUrl?: string;
  unsubscribeUrl: string;
}): string {
  const { heading, body, ctaText, ctaUrl, imageUrl, unsubscribeUrl } = options;

  const imageBlock = imageUrl
    ? `<tr>
        <td style="padding:0;">
          <img src="${imageUrl}" alt="" width="600" style="display:block;width:100%;max-width:600px;height:auto;border-radius:0;" />
        </td>
      </tr>`
    : '';

  const ctaBlock =
    ctaText && ctaUrl
      ? `<table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding:32px 0 8px;">
              <a href="${ctaUrl}"
                 style="display:inline-block;padding:14px 48px;background-color:#CCB377;color:#1B1919;font-size:13px;font-weight:700;text-decoration:none;border-radius:4px;letter-spacing:1.5px;text-transform:uppercase;font-family:'Helvetica Neue',Arial,sans-serif;">
                ${ctaText}
              </a>
            </td>
          </tr>
        </table>`
      : '';

  // Convert newlines in body to <br> for proper HTML rendering
  const bodyHtml = body.replace(/\n/g, '<br>');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${heading}</title>
</head>
<body style="margin:0;padding:0;background-color:#121010;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#121010;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#1B1919;overflow:hidden;">

          <!-- Logo -->
          <tr>
            <td style="padding:36px 40px 28px;text-align:center;border-bottom:1px solid #2E2B2B;">
              <h1 style="margin:0;font-size:24px;font-weight:700;color:#CCB377;letter-spacing:3px;font-family:'Helvetica Neue',Arial,sans-serif;text-transform:uppercase;">
                N&ouml;nDecants
              </h1>
            </td>
          </tr>

          <!-- Image -->
          ${imageBlock}

          <!-- Content -->
          <tr>
            <td style="padding:40px 40px 16px;">
              <h2 style="margin:0 0 20px;font-size:22px;color:#FFFFFF;font-weight:600;letter-spacing:0.5px;line-height:1.3;">
                ${heading}
              </h2>
              <p style="margin:0;font-size:15px;line-height:1.7;color:#A09A9A;">
                ${bodyHtml}
              </p>
              ${ctaBlock}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:32px 40px;border-top:1px solid #2E2B2B;">
              <p style="margin:0 0 12px;font-size:11px;color:#666;text-align:center;letter-spacing:0.5px;">
                &copy; ${new Date().getFullYear()} N&ouml;nDecants &mdash; Ecuador
              </p>
              <p style="margin:0;font-size:11px;color:#666;text-align:center;">
                <a href="${unsubscribeUrl}" style="color:#A09A9A;text-decoration:underline;">
                  Cancelar suscripci&oacute;n
                </a>
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
