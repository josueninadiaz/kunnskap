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
    <header className="space-y-3 pb-8">
      <h1 className="text-3xl sm:text-4xl">{title}</h1>
      {description ? <p className="max-w-(--container-prose) text-lg text-fg-muted">{description}</p> : null}
    </header>
  )
}
