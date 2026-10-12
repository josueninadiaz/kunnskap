/** Respuesta de error RFC 9457 (application/problem+json) emitida por la API. */
export interface ProblemDetails {
  type?: string
  title?: string
  status?: number
  detail?: string
  traceId?: string
  code?: string
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

  /** Errores de validación de un campo (las claves de la API se comparan sin distinguir mayúsculas). */
  fieldErrors(field: string): string[] {
    const errors = this.problem?.errors ?? {}
    const key = Object.keys(errors).find((k) => k.toLowerCase() === field.toLowerCase())
    return key ? (errors[key] ?? []) : []
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

async function request(path: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(`/api${path}`, { credentials: 'same-origin', ...init })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new NetworkError()
  }
}

async function parse<T>(response: Response): Promise<T> {
  if (!response.ok) throw new ApiError(response.status, await readProblem(response))
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export async function apiGet<T>(path: string, init?: { signal?: AbortSignal }): Promise<T> {
  const response = await request(path, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal: init?.signal ?? null,
  })
  return parse<T>(response)
}

/*
 * Protección CSRF: las peticiones que modifican datos llevan el token antiforgery en la cabecera
 * X-XSRF-TOKEN. El token depende de la identidad, así que se descarta al iniciar o cerrar sesión.
 */
let csrfToken: Promise<string> | null = null

function getCsrfToken(): Promise<string> {
  csrfToken ??= apiGet<{ token: string }>('/auth/antiforgery')
    .then((r) => r.token)
    .catch((error: unknown) => {
      csrfToken = null
      throw error
    })
  return csrfToken
}

export function resetCsrfToken(): void {
  csrfToken = null
}

type MutationMethod = 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export async function apiSend<T>(method: MutationMethod, path: string, body?: unknown): Promise<T> {
  const send = async () =>
    request(path, {
      method,
      headers: {
        Accept: 'application/json',
        'X-XSRF-TOKEN': await getCsrfToken(),
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? null : JSON.stringify(body),
    })

  let response = await send()

  // Si el token caducó (p. ej. la sesión cambió en otra pestaña), se pide uno nuevo y se reintenta una vez.
  if (response.status === 400) {
    const problem = await readProblem(response.clone())
    if (problem?.code === 'antiforgery') {
      resetCsrfToken()
      response = await send()
    }
  }

  return parse<T>(response)
}

/** Mensaje comprensible para mostrar al usuario a partir de cualquier error. */
export function describeError(error: unknown): string {
  if (error instanceof NetworkError) return error.message
  if (error instanceof ApiError) {
    if (error.status >= 500) return 'El servidor tuvo un problema. Inténtalo de nuevo en unos minutos.'
    return error.problem?.detail ?? error.problem?.title ?? error.message
  }
  return 'Ocurrió un error inesperado.'
}
