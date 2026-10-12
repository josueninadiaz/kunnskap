import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, apiGet, apiSend, resetCsrfToken } from '../../lib/api'

export interface CurrentUser {
  id: string
  email: string
  displayName: string
  roles: string[]
  permissions: string[]
}

export interface RegisterInput {
  email: string
  password: string
  displayName: string
}

export interface LoginInput {
  email: string
  password: string
  rememberMe: boolean
}

const meKey = ['auth', 'me'] as const

/** Persona con sesión iniciada, o null si no hay sesión. */
async function fetchCurrentUser({ signal }: { signal: AbortSignal }): Promise<CurrentUser | null> {
  try {
    return await apiGet<CurrentUser>('/auth/me', { signal })
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null
    throw error
  }
}

export function useCurrentUser() {
  return useQuery({ queryKey: meKey, queryFn: fetchCurrentUser, staleTime: 5 * 60_000 })
}

function useSessionMutation<TInput>(send: (input: TInput) => Promise<CurrentUser | null>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: send,
    onSuccess: (user) => {
      // La identidad cambió: el token antiforgery anterior ya no es válido.
      resetCsrfToken()
      queryClient.setQueryData(meKey, user)
    },
  })
}

export function useRegister() {
  return useSessionMutation((input: RegisterInput) => apiSend<CurrentUser>('POST', '/auth/register', input))
}

export function useLogin() {
  return useSessionMutation((input: LoginInput) => apiSend<CurrentUser>('POST', '/auth/login', input))
}

export function useLogout() {
  return useSessionMutation(async () => {
    await apiSend<void>('POST', '/auth/logout')
    return null
  })
}

/**
 * Ruta interna a la que volver tras iniciar sesión. Solo se aceptan rutas relativas del propio
 * sitio para evitar redirecciones abiertas (p. ej. "//sitio-malicioso.com").
 */
export function safeReturnPath(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return '/'
  return value
}
