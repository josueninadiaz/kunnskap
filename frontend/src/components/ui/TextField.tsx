import { type InputHTMLAttributes, type ReactNode, useId } from 'react'

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  hint?: ReactNode
  errors?: string[]
}

/**
 * Campo de texto accesible: etiqueta visible asociada, pista y errores enlazados con
 * aria-describedby, y aria-invalid cuando hay errores. Altura mínima de 44 px para pantallas táctiles.
 */
export function TextField({ label, hint, errors = [], className, ...props }: TextFieldProps) {
  const id = useId()
  const hintId = `${id}-pista`
  const errorId = `${id}-error`
  const hasErrors = errors.length > 0
  const describedBy = [hint ? hintId : null, hasErrors ? errorId : null].filter(Boolean).join(' ') || undefined

  return (
    <div className={`space-y-1.5 ${className ?? ''}`}>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      {hint ? (
        <p id={hintId} className="text-sm text-fg-muted">
          {hint}
        </p>
      ) : null}
      <input
        id={id}
        aria-invalid={hasErrors || undefined}
        aria-describedby={describedBy}
        className={`block min-h-11 w-full rounded-(--radius-control) border bg-surface px-3 py-2 text-base text-fg placeholder:text-fg-muted ${
          hasErrors ? 'border-danger' : 'border-border-strong'
        }`}
        {...props}
      />
      {hasErrors ? (
        <ul id={errorId} className="space-y-0.5 text-sm text-danger">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
