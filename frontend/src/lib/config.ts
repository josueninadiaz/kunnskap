/** Configuración pública del frontend. El nombre de la plataforma (Kunnskap) es configurable. */
export const config = {
  platformName: import.meta.env.VITE_PLATFORM_NAME?.trim() || 'Kunnskap',
} as const
