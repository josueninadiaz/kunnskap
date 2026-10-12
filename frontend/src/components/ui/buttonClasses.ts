export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'stage' | 'stage-secondary'
export type ButtonSize = 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-[background-color,color,border-color,transform] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-55'

const sizes: Record<ButtonSize, string> = {
  md: 'min-h-11 px-5 text-[0.9375rem]',
  lg: 'min-h-12 px-6 text-base',
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-fg hover:bg-accent-hover',
  secondary: 'border border-border bg-surface text-fg hover:border-border-strong',
  ghost: 'text-fg hover:bg-surface-muted',
  // Sobre escenas oscuras (portada, cabecera de curso).
  stage: 'bg-stage-accent text-stage hover:bg-stage-fg',
  'stage-secondary': 'border border-stage-border text-stage-fg hover:bg-stage-raised',
}

export function buttonClasses(variant: ButtonVariant = 'primary', className = '', size: ButtonSize = 'md'): string {
  return `${base} ${sizes[size]} ${variants[variant]} ${className}`.trim()
}
