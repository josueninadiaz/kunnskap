/**
 * Quita lo que rompería la cadena de C# ("…"): comillas, barras invertidas y saltos de línea.
 * Así el código mostrado es siempre un programa válido y la salida es exactamente la que imprimiría.
 */
export function sanitizeName(value: string): string {
  return value.replace(/["\\\r\n]/g, '').slice(0, 24)
}
