import { isRouteErrorResponse, useRouteError } from 'react-router'
import { ButtonLink } from '../components/ui/Button'
import { PageHeader } from '../components/ui/PageHeader'

export function NotFoundPage() {
  return (
    <section>
      <PageHeader title="Página no encontrada" description="La dirección que buscas no existe o se ha movido." />
      <ButtonLink to="/">Volver al inicio</ButtonLink>
    </section>
  )
}

/** Se muestra si una página falla al cargar o renderizar. No expone detalles técnicos. */
export function RouteError() {
  const error = useRouteError()

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFoundPage />
  }

  return (
    <section>
      <PageHeader
        title="Algo salió mal"
        description="No pudimos mostrar esta página. Recarga la página o vuelve al inicio."
      />
      <ButtonLink to="/">Volver al inicio</ButtonLink>
    </section>
  )
}
