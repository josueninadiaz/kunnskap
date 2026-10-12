export type ButtonVariant = 'primary' | 'secondary'

const base =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-(--radius-control) px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-fg hover:bg-accent-hover',
  secondary: 'border border-border bg-surface text-fg hover:bg-surface-muted',
}

export function buttonClasses(variant: ButtonVariant = 'primary', className = ''): string {
  return `${base} ${variants[variant]} ${className}`.trim()
}
