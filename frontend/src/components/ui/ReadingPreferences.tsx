import { Accessibility, X } from 'lucide-react'
import { useId, useRef, useSyncExternalStore } from 'react'
import {
  defaultPreferences,
  getPreferencesSnapshot,
  type ReadingPreferences,
  setPreferences,
  subscribePreferences,
} from '../../lib/preferences'
import { Button } from './Button'
import { ThemeToggle } from './ThemeToggle'

type Option<K extends keyof ReadingPreferences> = { value: ReadingPreferences[K]; label: string; hint?: string }

const groups: { [K in keyof ReadingPreferences]: { legend: string; options: Option<K>[] } } = {
  text: {
    legend: 'Tamaño del texto',
    options: [
      { value: 'normal', label: 'Normal' },
      { value: 'grande', label: 'Grande' },
      { value: 'muy-grande', label: 'Muy grande' },
    ],
  },
  spacing: {
    legend: 'Espaciado',
    options: [
      { value: 'normal', label: 'Normal' },
      { value: 'amplio', label: 'Amplio', hint: 'Más espacio entre líneas, letras y palabras.' },
    ],
  },
  font: {
    legend: 'Tipografía',
    options: [
      { value: 'estandar', label: 'Estándar' },
      { value: 'legible', label: 'Alta legibilidad', hint: 'Atkinson Hyperlegible, diseñada para baja visión.' },
    ],
  },
  motion: {
    legend: 'Animaciones',
    options: [
      { value: 'sistema', label: 'Como mi sistema' },
      { value: 'reducido', label: 'Reducidas', hint: 'Sin movimiento ni animaciones automáticas.' },
    ],
  },
  links: {
    legend: 'Enlaces',
    options: [
      { value: 'normal', label: 'Como en el diseño' },
      { value: 'subrayados', label: 'Siempre subrayados' },
    ],
  },
}

function RadioGroup<K extends keyof ReadingPreferences>({
  name,
  value,
  onChange,
}: {
  name: K
  value: ReadingPreferences[K]
  onChange: (value: ReadingPreferences[K]) => void
}) {
  const id = useId()
  const group = groups[name]
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 font-semibold">{group.legend}</legend>
      <div className="flex flex-wrap gap-2">
        {group.options.map((option) => (
          <label key={option.value} className="cursor-pointer">
            <input
              type="radio"
              name={`${id}-${name}`}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />
            <span className="inline-flex min-h-11 items-center rounded-full border border-border-strong px-4 text-[0.9375rem] peer-checked:border-accent peer-checked:bg-accent peer-checked:text-accent-fg peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus">
              {option.label}
            </span>
          </label>
        ))}
      </div>
      {group.options.find((o) => o.value === value)?.hint ? (
        <p className="text-sm text-fg-muted">{group.options.find((o) => o.value === value)?.hint}</p>
      ) : null}
    </fieldset>
  )
}

/**
 * Botón y panel de preferencias de lectura. Usa <dialog> nativo: atrapa el foco, se cierra con
 * Escape y los lectores de pantalla lo anuncian como diálogo.
 */
export function ReadingPreferencesButton({ wide = false }: { wide?: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const preferences = useSyncExternalStore(subscribePreferences, getPreferencesSnapshot)
  const titleId = useId()

  function update<K extends keyof ReadingPreferences>(key: K, value: ReadingPreferences[K]) {
    setPreferences({ ...preferences, [key]: value })
  }

  function reset() {
    setPreferences(defaultPreferences)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className={
          wide
            ? 'flex min-h-11 w-full items-center justify-between rounded-(--radius-control) px-3 text-left text-lg font-medium hover:bg-surface-muted'
            : 'inline-flex size-10 items-center justify-center rounded-full text-fg-muted hover:bg-surface-muted hover:text-fg'
        }
        aria-haspopup="dialog"
      >
        {wide ? <span>Preferencias de lectura</span> : <span className="sr-only">Preferencias de lectura y accesibilidad</span>}
        <Accessibility aria-hidden="true" className="size-5" />
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="m-auto w-[min(34rem,calc(100vw-2rem))] rounded-[1.5rem] border border-border bg-surface p-0 text-fg shadow-soft backdrop:bg-black/50 backdrop:backdrop-blur-sm"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 id={titleId} className="text-xl font-semibold">
            Preferencias de lectura
          </h2>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="inline-flex size-10 items-center justify-center rounded-full hover:bg-surface-muted"
          >
            <X aria-hidden="true" className="size-5" />
            <span className="sr-only">Cerrar</span>
          </button>
        </div>
        <div className="max-h-[70dvh] space-y-6 overflow-y-auto px-6 py-6">
          <p className="text-[0.9375rem] text-fg-muted">
            Ajusta la web a tu manera. Los cambios se ven al instante y se guardan en este navegador.
          </p>
          <fieldset className="space-y-2">
            <legend className="mb-2 font-semibold">Apariencia</legend>
            <ThemeToggle />
          </fieldset>
          <RadioGroup name="text" value={preferences.text} onChange={(v) => update('text', v)} />
          <RadioGroup name="spacing" value={preferences.spacing} onChange={(v) => update('spacing', v)} />
          <RadioGroup name="font" value={preferences.font} onChange={(v) => update('font', v)} />
          <RadioGroup name="motion" value={preferences.motion} onChange={(v) => update('motion', v)} />
          <RadioGroup name="links" value={preferences.links} onChange={(v) => update('links', v)} />
        </div>
        <div className="flex justify-between gap-3 border-t border-border px-6 py-4">
          <Button variant="ghost" onClick={reset}>
            Restablecer
          </Button>
          <Button onClick={() => dialogRef.current?.close()}>Listo</Button>
        </div>
      </dialog>
    </>
  )
}
