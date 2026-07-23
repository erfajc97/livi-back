import { SetMetadata } from '@nestjs/common';

export const IS_OPTIONAL_AUTH_KEY = 'isOptionalAuth';

/**
 * Marca una ruta como de autenticación opcional: si llega un JWT válido se
 * puebla `req.user`; si no llega token (o es inválido/expirado) la request
 * continúa con `user = null` en lugar de responder 401. Pensado para el
 * checkout guest (crear orden / subir comprobante sin sesión).
 */
export const OptionalAuth = () => SetMetadata(IS_OPTIONAL_AUTH_KEY, true);
