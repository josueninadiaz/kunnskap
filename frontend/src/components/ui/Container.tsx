import type { ReactNode } from 'react'
import { Outlet } from 'react-router'

/** Ancho máximo y márgenes laterales comunes a todas las páginas. */
export function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-(--container-content) px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>
}

/** Página estándar: contenedor con el espacio vertical habitual. */
export function Page({ children, narrow = false }: { children: ReactNode; narrow?: boolean }) {
  return (
    <Container className="py-12 sm:py-16">
      <div className={narrow ? 'mx-auto max-w-(--container-prose)' : ''}>{children}</div>
    </Container>
  )
}

/** Ruta de diseño para las páginas estándar. */
export function PageLayout() {
  return (
    <Page>
      <Outlet />
    </Page>
  )
}
