/**
 * Preferencias de lectura y accesibilidad. Se aplican como atributos data-* en <html> y el CSS
 * reacciona a ellos (ver styles/index.css). Se guardan en este navegador; si el almacenamiento no
 * está disponible, se aplican solo durante la visita.
 */
export interface ReadingPreferences {
  /** Tamaño del texto. */
  text: 'normal' | 'grande' | 'muy-grande'
  /** Interlineado y espaciado entre letras y palabras (WCAG 1.4.12). */
  spacing: 'normal' | 'amplio'
  /** Tipografía: la de la marca o una de alta legibilidad (Atkinson Hyperlegible). */
  font: 'estandar' | 'legible'
  /** Animaciones: las del sistema operativo o reducidas siempre. */
  motion: 'sistema' | 'reducido'
  /** Subrayar siempre los enlaces. */
  links: 'normal' | 'subrayados'
}

export const defaultPreferences: ReadingPreferences = {
  text: 'normal',
  spacing: 'normal',
  font: 'estandar',
  motion: 'sistema',
  links: 'normal',
}

const STORAGE_KEY = 'kunnskap.preferencias'

const allowed: { [K in keyof ReadingPreferences]: readonly ReadingPreferences[K][] } = {
  text: ['normal', 'grande', 'muy-grande'],
  spacing: ['normal', 'amplio'],
  font: ['estandar', 'legible'],
  motion: ['sistema', 'reducido'],
  links: ['normal', 'subrayados'],
}

export function readPreferences(): ReadingPreferences {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<Record<string, unknown>>
    const result = { ...defaultPreferences }
    for (const key of Object.keys(allowed) as (keyof ReadingPreferences)[]) {
      const value = stored[key]
      if ((allowed[key] as readonly unknown[]).includes(value)) {
        ;(result as Record<string, unknown>)[key] = value
      }
    }
    return result
  } catch {
    return { ...defaultPreferences }
  }
}

export function applyPreferences(preferences: ReadingPreferences): void {
  const root = document.documentElement
  for (const [key, value] of Object.entries(preferences)) {
    const isDefault = defaultPreferences[key as keyof ReadingPreferences] === value
    if (isDefault) root.removeAttribute(`data-${key}`)
    else root.setAttribute(`data-${key}`, value)
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
  } catch {
    // Sin almacenamiento, las preferencias duran hasta recargar.
  }
}

/** ¿Debe la interfaz evitar animaciones (preferencia del sistema o de la persona)? */
export function prefersReducedMotion(): boolean {
  if (document.documentElement.getAttribute('data-motion') === 'reducido') return true
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Almacén compartido: el panel de escritorio y el del menú móvil muestran los mismos valores.
const listeners = new Set<() => void>()
let current: ReadingPreferences | null = null

export function subscribePreferences(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getPreferencesSnapshot(): ReadingPreferences {
  current ??= readPreferences()
  return current
}

export function setPreferences(preferences: ReadingPreferences): void {
  current = preferences
  applyPreferences(preferences)
  for (const listener of listeners) listener()
}
