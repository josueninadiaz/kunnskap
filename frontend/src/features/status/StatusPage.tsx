import { useQuery } from '@tanstack/react-query'
import { Button } from '../../components/ui/Button'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatusMessage } from '../../components/ui/StatusMessage'
import { ApiError, apiGet, describeError } from '../../lib/api'

export interface HealthResponse {
  status: 'ok' | 'degraded'
  database: boolean
}

async function fetchHealth({ signal }: { signal: AbortSignal }): Promise<HealthResponse> {
  try {
    return await apiGet<HealthResponse>('/health', { signal })
  } catch (error) {
    // La API responde 503 con un cuerpo válido cuando la base de datos no está disponible.
    if (error instanceof ApiError && error.status === 503) {
      return { status: 'degraded', database: false }
    }
    throw error
  }
}

export function StatusPage() {
  const health = useQuery({ queryKey: ['health'], queryFn: fetchHealth, retry: false, staleTime: 0 })

  return (
    <section className="max-w-(--container-prose)">
      <PageHeader
        title="Estado del servicio"
        description="Comprueba si la plataforma y su base de datos están disponibles."
      />

      {health.isPending ? <StatusMessage tone="loading" title="Comprobando el estado…" /> : null}

      {health.isError ? (
        <StatusMessage
          tone="error"
          title="No se pudo comprobar el estado"
          action={
            <Button variant="secondary" onClick={() => void health.refetch()}>
              Reintentar
            </Button>
          }
        >
          {describeError(health.error)}
        </StatusMessage>
      ) : null}

      {health.isSuccess && health.data.status === 'ok' ? (
        <StatusMessage tone="success" title="Todo funciona correctamente">
          La API y la base de datos responden.
        </StatusMessage>
      ) : null}

      {health.isSuccess && health.data.status === 'degraded' ? (
        <StatusMessage
          tone="error"
          title="Servicio degradado"
          action={
            <Button variant="secondary" onClick={() => void health.refetch()}>
              Reintentar
            </Button>
          }
        >
          La API responde, pero la base de datos no está disponible en este momento.
        </StatusMessage>
      ) : null}
    </section>
  )
}
