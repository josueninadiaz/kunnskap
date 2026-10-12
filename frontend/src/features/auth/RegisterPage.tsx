import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button } from '../../components/ui/Button'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatusMessage } from '../../components/ui/StatusMessage'
import { TextField } from '../../components/ui/TextField'
import { ApiError, describeError } from '../../lib/api'
import { useRegister } from './authApi'

export function RegisterPage() {
  const navigate = useNavigate()
  const register = useRegister()
  const [showPassword, setShowPassword] = useState(false)

  const isValidationError = register.error instanceof ApiError && register.error.status === 400
  const fieldErrors = (field: string) => (register.error instanceof ApiError ? register.error.fieldErrors(field) : [])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    register.mutate(
      {
        displayName: String(form.get('displayName') ?? ''),
        email: String(form.get('email') ?? ''),
        password: String(form.get('password') ?? ''),
      },
      { onSuccess: () => void navigate('/', { replace: true }) },
    )
  }

  return (
    <section className="mx-auto max-w-md">
      <PageHeader
        title="Crear una cuenta"
        description="Es gratis y siempre lo será. Solo necesitamos un correo y un nombre para dirigirnos a ti."
      />

      <form noValidate onSubmit={handleSubmit} className="space-y-5">
        {register.isError ? (
          <StatusMessage
            tone="error"
            title={isValidationError ? 'Revisa los datos marcados' : 'No se pudo crear la cuenta'}
          >
            {isValidationError ? 'Corrige los campos indicados y vuelve a intentarlo.' : describeError(register.error)}
          </StatusMessage>
        ) : null}

        <TextField
          label="Nombre"
          hint="Cómo quieres que te llamemos. Puede ser un apodo."
          name="displayName"
          autoComplete="nickname"
          required
          maxLength={80}
          errors={fieldErrors('displayName')}
        />
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
          hint="Al menos 12 caracteres. Una frase que recuerdes, como «mi perro come manzanas verdes», es segura y fácil de recordar."
          name="password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          required
          minLength={12}
          errors={fieldErrors('password')}
        />

        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={showPassword}
            onChange={(e) => setShowPassword(e.target.checked)}
            className="size-5 accent-accent"
          />
          Mostrar contraseña
        </label>

        <p className="text-sm text-fg-muted">
          Al crear la cuenta aceptas cómo tratamos tus datos, explicado en la{' '}
          <Link to="/privacidad" className="font-medium text-accent underline">
            página de privacidad
          </Link>
          .
        </p>

        <Button type="submit" className="w-full" disabled={register.isPending}>
          {register.isPending ? 'Creando la cuenta…' : 'Crear cuenta'}
        </Button>
      </form>

      <p className="mt-8 text-sm text-fg-muted">
        ¿Ya tienes cuenta?{' '}
        <Link to="/entrar" className="font-medium text-accent underline">
          Inicia sesión
        </Link>
      </p>
    </section>
  )
}
