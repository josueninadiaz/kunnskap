/*
 * Avisos legales exigidos por la licencia (ver NOTICE.md en la raíz del repositorio).
 *
 * ORIGINAL_AUTHOR y la frase de atribución NO son configuración: la sección 7(b) de la AGPL-3.0
 * aplicada a este proyecto exige conservarlas en todas las versiones modificadas.
 */
export const ORIGINAL_AUTHOR = 'Josue Nina Diaz'

export const ORIGINAL_ATTRIBUTION = `Kunnskap fue creado originalmente por ${ORIGINAL_AUTHOR}.`

export const CODE_LICENSE = {
  name: 'GNU AGPL-3.0',
  url: 'https://www.gnu.org/licenses/agpl-3.0.html',
} as const

export const CONTENT_LICENSE = {
  name: 'CC BY-SA 4.0',
  url: 'https://creativecommons.org/licenses/by-sa/4.0/deed.es',
} as const

/**
 * URL pública del código fuente de ESTA instancia. La sección 13 de la AGPL obliga a ofrecerla a
 * quien use el servicio a través de la red, así que debe configurarse en todo despliegue
 * (VITE_SOURCE_URL). Solo se aceptan URL https.
 */
export const sourceUrl: string | undefined = (() => {
  const value = import.meta.env.VITE_SOURCE_URL?.trim()
  return value?.startsWith('https://') ? value : undefined
})()
