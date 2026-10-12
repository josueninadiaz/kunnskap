import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '../lib/api'

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        // Reintentar errores de red o de servidor, pero no errores del cliente (4xx).
        retry: (failureCount, error) =>
          failureCount < 2 && !(error instanceof ApiError && error.status < 500),
        refetchOnWindowFocus: false,
      },
    },
  })
}
