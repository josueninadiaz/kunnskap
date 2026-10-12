import { useNavigate } from 'react-router'
import { Button, ButtonLink } from '../../components/ui/Button'
import { useCurrentUser, useLogout } from './authApi'

/** Estado de la sesión en la cabecera. `stacked`: versión a lo ancho para el menú móvil. */
export function AccountMenu({ stacked = false }: { stacked?: boolean }) {
  const { data: user, isPending } = useCurrentUser()
  const logout = useLogout()
  const navigate = useNavigate()

  // Mientras se comprueba la sesión no se muestra nada, para evitar un parpadeo de botones.
  if (isPending) return <div className="min-h-11" aria-hidden="true" />

  if (!user) {
    return (
      <div className={stacked ? 'grid grid-cols-2 gap-3' : 'flex items-center gap-2'}>
        <ButtonLink to="/entrar" variant={stacked ? 'secondary' : 'ghost'}>
          Entrar
        </ButtonLink>
        <ButtonLink to="/registro">Crear cuenta</ButtonLink>
      </div>
    )
  }

  const initial = user.displayName.trim().charAt(0).toUpperCase() || '?'

  return (
    <div className={stacked ? 'flex items-center justify-between gap-3' : 'flex items-center gap-3'}>
      <span className="flex items-center gap-2.5 text-[0.9375rem]">
        <span
          aria-hidden="true"
          className="inline-flex size-8 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent-soft-fg"
        >
          {initial}
        </span>
        <span>
          <span className="sr-only">Sesión iniciada como </span>
          <span className="font-medium">{user.displayName}</span>
        </span>
      </span>
      <Button
        variant="ghost"
        disabled={logout.isPending}
        onClick={() => logout.mutate(undefined, { onSuccess: () => void navigate('/') })}
      >
        Cerrar sesión
      </Button>
    </div>
  )
}
