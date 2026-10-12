import { QueryClient } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { vi } from 'vitest'
import { AppProviders } from '../app/providers'
import { routes } from '../app/routes'
import { resetCsrfToken } from '../lib/api'

/** Renderiza la aplicación completa (router real) en la ruta indicada. */
export function renderRoute(path: string) {
  resetCsrfToken()
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  const view = render(
    <AppProviders client={client}>
      <RouterProvider router={router} />
    </AppProviders>,
  )
  return { ...view, router }
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': status >= 400 ? 'application/problem+json' : 'application/json' },
  })
}

export const facetsFixture = {
  schools: [
    { slug: 'fundamentos', name: 'Fundamentos digitales y programación', description: 'Punto de partida.', publishedCourses: 0, coursesInDevelopment: 3 },
    { slug: 'ciberseguridad', name: 'Ciberseguridad defensiva', description: 'Laboratorios legales.', publishedCourses: 1, coursesInDevelopment: 8 },
  ],
  technologies: [{ slug: 'csharp', name: 'C#' }],
  levels: ['Beginner', 'Intermediate', 'Advanced'],
}

type Handler = (init: RequestInit | undefined) => Response | Promise<Response>

/** Respuestas por defecto: visitante sin sesión y token antiforgery disponible. */
const defaultHandlers: Record<string, Handler> = {
  'GET /api/auth/me': () => jsonResponse({ title: 'No autorizado', status: 401 }, 401),
  'GET /api/auth/antiforgery': () => jsonResponse({ token: 'token-de-prueba' }),
  'GET /api/catalog/facets': () => jsonResponse(facetsFixture),
  // Curso destacado de la portada: por defecto no existe y la sección se oculta.
  'GET /api/catalog/courses/programar-desde-cero-con-csharp': () => jsonResponse({ status: 404 }, 404),
}

/**
 * Simula la API por método y ruta, p. ej. { 'POST /api/auth/login': () => jsonResponse(user) }.
 * Un "*" final permite coincidir por prefijo (útil con parámetros de consulta).
 * Una petición no simulada hace fallar la prueba, para no ocultar llamadas inesperadas.
 */
export function mockApi(handlers: Record<string, Handler> = {}) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const key = `${(init?.method ?? 'GET').toUpperCase()} ${url}`
    const all = { ...defaultHandlers, ...handlers }
    // Coincidencia exacta o por prefijo con "*" al final (p. ej. 'GET /api/catalog/courses?*').
    const handler =
      all[key] ?? Object.entries(all).find(([k]) => k.endsWith('*') && key.startsWith(k.slice(0, -1)))?.[1]
    if (!handler) throw new Error(`Petición no simulada: ${key}`)
    return handler(init)
  })
}

/** Lista de peticiones realizadas a la API ("MÉTODO /ruta"). */
export function apiCalls(fetchMock: ReturnType<typeof mockApi>): string[] {
  return fetchMock.mock.calls.map(([input, init]) => `${(init?.method ?? 'GET').toUpperCase()} ${String(input)}`)
}
