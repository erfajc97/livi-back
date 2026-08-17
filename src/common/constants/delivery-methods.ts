/**
 * Métodos de entrega y su costo. Fuente de verdad del servidor: la venta manual
 * cobra el envío con estos valores y no con lo que mande el panel.
 */
export const DELIVERY_COSTS: Record<string, number> = {
  RETIRO: 0,
  ENTREGA_PERSONAL: 0,
  RETIRO_PIWU: 2,
  SERVIENTREGA_GYE: 3,
  SERVIENTREGA_NACIONAL: 6.5,
};

/** Costo del método, 0 si no se reconoce (nunca cobra de más por un typo). */
export function getDeliveryCost(method?: string): number {
  if (!method) return 0;
  return DELIVERY_COSTS[method] ?? 0;
}

/** Los envíos por Servientrega son los que generan guía. */
export function requiresShipment(method?: string): boolean {
  return Boolean(method?.startsWith('SERVIENTREGA'));
}
