import { Monitor, Moon, Sun } from 'lucide-react'
import { useId, useSyncExternalStore } from 'react'
import { getThemeSnapshot, setThemePreference, subscribeTheme, type ThemePreference } from '../../lib/theme'

const options: { value: ThemePreference; label: string; Icon: typeof Sun }[] = [
  { value: 'light', label: 'Tema claro', Icon: Sun },
  { value: 'dark', label: 'Tema oscuro', Icon: Moon },
  { value: 'system', label: 'Tema del sistema', Icon: Monitor },
]

/**
 * Control segmentado de tema (claro, oscuro o el del sistema) hecho con radios nativos:
 * el teclado (flechas) y los lectores de pantalla funcionan sin código adicional.
 */
export function ThemeToggle() {
  const preference = useSyncExternalStore(subscribeTheme, getThemeSnapshot)
  const name = useId()

  return (
    <fieldset className="inline-flex rounded-full border border-border bg-surface-muted p-0.5">
      <legend className="sr-only">Tema</legend>
      {options.map(({ value, label, Icon }) => (
        <label key={value} title={label} className="relative cursor-pointer">
          <input
            type="radio"
            name={name}
            value={value}
            checked={preference === value}
            onChange={() => setThemePreference(value)}
            className="peer sr-only"
          />
          <span className="sr-only">{label}</span>
          <span
            aria-hidden="true"
            className="inline-flex size-8 items-center justify-center rounded-full text-fg-muted transition-colors peer-checked:bg-surface peer-checked:text-fg peer-checked:shadow-soft peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus hover:text-fg"
          >
            <Icon className="size-4" />
          </span>
        </label>
      ))}
    </fieldset>
  )
}
