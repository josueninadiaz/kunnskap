import { useNavigate } from 'react-router'
import { Button, ButtonLink } from '../../components/ui/Button'
import { useCurrentUser, useLogout } from './authApi'

/** Zona de la cabecera con el estado de la sesión: entrar/crear cuenta, o saludo y cerrar sesión. */
export function AccountMenu() {
  const { data: user, isPending } = useCurrentUser()
  const logout = useLogout()
  const navigate = useNavigate()

  // Mientras se comprueba la sesión no se muestra nada, para evitar un parpadeo de botones.
  if (isPending) return <div className="min-h-11" aria-hidden="true" />

  if (!user) {
    return (
      <div className="flex flex-wrap gap-2">
        <ButtonLink to="/entrar" variant="secondary">
          Entrar
        </ButtonLink>
        <ButtonLink to="/registro">Crear cuenta</ButtonLink>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm">
        Hola, <span className="font-medium">{user.displayName}</span>
      </span>
      <Button
        variant="secondary"
        disabled={logout.isPending}
        onClick={() => logout.mutate(undefined, { onSuccess: () => void navigate('/') })}
      >
        Cerrar sesión
      </Button>
    </div>
  )
}
