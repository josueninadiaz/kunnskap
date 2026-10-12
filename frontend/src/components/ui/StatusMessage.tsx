import { AlertTriangle, CheckCircle2, Info, Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'

type Tone = 'loading' | 'info' | 'success' | 'error'

const toneStyles: Record<Tone, string> = {
  loading: 'border-border bg-surface text-fg',
  info: 'border-border bg-surface-muted text-fg',
  success: 'border-success/40 bg-success-soft text-fg',
  error: 'border-danger/40 bg-danger-soft text-fg',
}

const icons: Record<Tone, ReactNode> = {
  loading: <Loader2 aria-hidden="true" className="size-5 shrink-0 animate-spin text-fg-muted" />,
  info: <Info aria-hidden="true" className="size-5 shrink-0 text-fg-muted" />,
  success: <CheckCircle2 aria-hidden="true" className="size-5 shrink-0 text-success" />,
  error: <AlertTriangle aria-hidden="true" className="size-5 shrink-0 text-danger" />,
}

interface StatusMessageProps {
  tone: Tone
  title: string
  children?: ReactNode
  action?: ReactNode
}

/**
 * Mensaje de estado para carga, vacío, éxito o error. Los errores se anuncian de inmediato
 * a lectores de pantalla (role="alert"); el resto, de forma no intrusiva (role="status").
 */
export function StatusMessage({ tone, title, children, action }: StatusMessageProps) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex gap-3 rounded-(--radius-panel) border p-4 ${toneStyles[tone]}`}
    >
      {icons[tone]}
      <div className="min-w-0 space-y-1">
        <p className="font-medium">{title}</p>
        {children ? <div className="text-sm text-fg-muted">{children}</div> : null}
        {action ? <div className="pt-2">{action}</div> : null}
      </div>
    </div>
  )
}
