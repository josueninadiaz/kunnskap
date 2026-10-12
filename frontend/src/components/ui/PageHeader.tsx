import { type ReactNode, useEffect } from 'react'
import { config } from '../../lib/config'

interface PageHeaderProps {
  title: string
  description?: ReactNode
}

/** Título principal de la página. También actualiza el título del documento. */
export function PageHeader({ title, description }: PageHeaderProps) {
  useEffect(() => {
    document.title = `${title} · ${config.platformName}`
  }, [title])

  return (
    <div className="space-y-4 pb-10">
      <h1 className="headline">{title}</h1>
      {description ? <p className="lead max-w-(--container-prose) text-fg-muted">{description}</p> : null}
    </div>
  )
}
