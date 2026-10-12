export type ThemePreference = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'kunnskap.theme'

/** Preferencia guardada. El almacenamiento puede no estar disponible (modo privado): se usa "system". */
export function readThemePreference(): ThemePreference {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : 'system'
  } catch {
    return 'system'
  }
}

/** Aplica la preferencia: "system" quita el atributo y deja decidir a prefers-color-scheme. */
export function applyThemePreference(preference: ThemePreference): void {
  const root = document.documentElement
  if (preference === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', preference)

  try {
    if (preference === 'system') localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, preference)
  } catch {
    // Sin almacenamiento la elección dura hasta recargar; la página funciona igual.
  }
}
