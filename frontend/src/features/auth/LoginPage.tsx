import { type FormEvent, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { Button } from '../../components/ui/Button'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatusMessage } from '../../components/ui/StatusMessage'
import { TextField } from '../../components/ui/TextField'
import { ApiError, describeError } from '../../lib/api'
import { safeReturnPath, useLogin } from './authApi'

export function LoginPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const login = useLogin()
  const [showPassword, setShowPassword] = useState(false)

  const returnPath = safeReturnPath(searchParams.get('volver'))
  const fieldErrors = (field: string) => (login.error instanceof ApiError ? login.error.fieldErrors(field) : [])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    login.mutate(
      {
        email: String(form.get('email') ?? ''),
        password: String(form.get('password') ?? ''),
        rememberMe: form.get('rememberMe') === 'on',
      },
      { onSuccess: () => void navigate(returnPath, { replace: true }) },
    )
  }

  return (
    <section className="mx-auto max-w-md rounded-[1.5rem] border border-border bg-surface p-6 shadow-soft sm:p-10">
      <PageHeader title="Iniciar sesión" description="Continúa donde lo dejaste." />

      <form noValidate onSubmit={handleSubmit} className="space-y-5" aria-describedby={login.isError ? 'login-error' : undefined}>
        {login.isError ? (
          <div id="login-error">
            <StatusMessage tone="error" title="No se pudo iniciar sesión">
              {describeError(login.error)}
            </StatusMessage>
          </div>
        ) : null}

        <TextField
          label="Correo electrónico"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          errors={fieldErrors('email')}
        />
        <TextField
          label="Contraseña"
          name="password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          required
          errors={fieldErrors('password')}
        />

        <div className="space-y-3 text-sm">
          <label className="flex min-h-11 items-center gap-3">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              className="size-5 accent-accent"
            />
            Mostrar contraseña
          </label>
          <label className="flex min-h-11 items-start gap-3">
            <input type="checkbox" name="rememberMe" className="mt-0.5 size-5 shrink-0 accent-accent" />
            <span>
              Mantener la sesión iniciada
              <span className="block text-fg-muted">No lo marques si usas un ordenador compartido.</span>
            </span>
          </label>
        </div>

        <Button type="submit" className="w-full" disabled={login.isPending}>
          {login.isPending ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>

      <p className="mt-8 text-sm text-fg-muted">
        ¿Aún no tienes cuenta?{' '}
        <Link to="/registro" className="font-medium text-accent underline">
          Crea una gratis
        </Link>
      </p>
    </section>
  )
}
