/** Respuesta de error RFC 9457 (application/problem+json) emitida por la API. */
export interface ProblemDetails {
  type?: string
  title?: string
  status?: number
  detail?: string
  traceId?: string
  errors?: Record<string, string[]>
}

export class ApiError extends Error {
  readonly status: number
  readonly problem: ProblemDetails | undefined

  constructor(status: number, problem?: ProblemDetails) {
    super(problem?.title ?? `La solicitud falló con el código ${status}.`)
    this.name = 'ApiError'
    this.status = status
    this.problem = problem
  }
}

/** Error de red: el servidor no respondió (sin conexión, API detenida, tiempo agotado). */
export class NetworkError extends Error {
  constructor() {
    super('No se pudo conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.')
    this.name = 'NetworkError'
  }
}

async function readProblem(response: Response): Promise<ProblemDetails | undefined> {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('json')) return undefined
  try {
    return (await response.json()) as ProblemDetails
  } catch {
    return undefined
  }
}

export async function apiGet<T>(path: string, init?: { signal?: AbortSignal }): Promise<T> {
  let response: Response
  try {
    response = await fetch(`/api${path}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
      signal: init?.signal ?? null,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new NetworkError()
  }

  if (!response.ok) {
    throw new ApiError(response.status, await readProblem(response))
  }

  return (await response.json()) as T
}

/** Mensaje comprensible para mostrar al usuario a partir de cualquier error. */
export function describeError(error: unknown): string {
  if (error instanceof NetworkError) return error.message
  if (error instanceof ApiError) {
    if (error.status >= 500) return 'El servidor tuvo un problema. Inténtalo de nuevo en unos minutos.'
    return error.problem?.detail ?? error.message
  }
  return 'Ocurrió un error inesperado.'
}
