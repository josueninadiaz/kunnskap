import { type SelectHTMLAttributes, useId } from 'react'

interface Option {
  value: string
  label: string
}

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label: string
  options: Option[]
  /** Texto de la opción vacía (sin filtro). */
  emptyLabel: string
}

export function SelectField({ label, options, emptyLabel, className, ...props }: SelectFieldProps) {
  const id = useId()
  return (
    <div className={`space-y-1.5 ${className ?? ''}`}>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <select
        id={id}
        className="block min-h-11 w-full rounded-(--radius-control) border border-border-strong bg-surface px-3 py-2 text-base text-fg"
        {...props}
      >
        <option value="">{emptyLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}
