/** Env vars arrive as strings. `"false"` is truthy in JS — only `"true"` enables the flag. */
export function envFlag(
  value: string | boolean | undefined | null,
  fallback = false,
): boolean {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  return String(value).trim().toLowerCase() === 'true';
}
