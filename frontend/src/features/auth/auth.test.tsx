import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { apiCalls, jsonResponse, mockApi, renderRoute } from '../../test/render'
import { safeReturnPath } from './authApi'

const ana = {
  id: '019a1c00-0000-7000-8000-00000000abcd',
  email: 'ana@example.org',
  displayName: 'Ana',
  roles: ['Student'],
  permissions: [],
}

/** Cabecera del sitio. Espera a que exista: con rutas diferidas, la app se pinta al cargar la ruta. */
async function header() {
  return within(await screen.findByRole('banner'))
}

describe('inicio de sesión', () => {
  it('envía el token antiforgery, actualiza la cabecera y vuelve a la ruta indicada', async () => {
    let sentToken: string | null = null
    let sentBody: unknown = null
    const fetchMock = mockApi({
      'POST /api/auth/login': (init) => {
        sentToken = new Headers(init?.headers).get('X-XSRF-TOKEN')
        sentBody = JSON.parse(String(init?.body))
        return jsonResponse(ana)
      },
    })

    const { router } = renderRoute('/entrar?volver=/contribuir')
    expect(await (await header()).findByRole('link', { name: 'Entrar' })).toBeInTheDocument()

    await userEvent.type(await screen.findByLabelText('Correo electrónico'), 'ana@example.org')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'una frase de prueba segura')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await (await header()).findByText('Ana')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/contribuir')
    expect(sentToken).toBe('token-de-prueba')
    expect(sentBody).toEqual({ email: 'ana@example.org', password: 'una frase de prueba segura', rememberMe: false })
    expect(apiCalls(fetchMock)).toContain('GET /api/auth/antiforgery')
  })

  it('muestra el mensaje de la API cuando las credenciales son incorrectas', async () => {
    mockApi({
      'POST /api/auth/login': () =>
        jsonResponse({ status: 401, title: 'No se pudo iniciar sesión.', detail: 'Correo o contraseña incorrectos.' }, 401),
    })

    renderRoute('/entrar')
    await userEvent.type(await screen.findByLabelText('Correo electrónico'), 'ana@example.org')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'equivocada')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos.')
  })

  it('permite mostrar la contraseña', async () => {
    mockApi()
    renderRoute('/entrar')

    const password = await screen.findByLabelText('Contraseña')
    expect(password).toHaveAttribute('type', 'password')

    await userEvent.click(screen.getByLabelText('Mostrar contraseña'))

    expect(password).toHaveAttribute('type', 'text')
  })
})

describe('registro', () => {
  it('muestra los errores de validación junto a cada campo', async () => {
    mockApi({
      'POST /api/auth/register': () =>
        jsonResponse(
          {
            status: 400,
            title: 'One or more validation errors occurred.',
            errors: { password: ['La contraseña debe tener al menos 12 caracteres.'] },
          },
          400,
        ),
    })

    renderRoute('/registro')
    await userEvent.type(await screen.findByLabelText('Nombre'), 'Ana')
    await userEvent.type(await screen.findByLabelText('Correo electrónico'), 'ana@example.org')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'corta')
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Revisa los datos marcados')
    const password = screen.getByLabelText('Contraseña')
    expect(password).toHaveAttribute('aria-invalid', 'true')
    expect(password).toHaveAccessibleDescription(/al menos 12 caracteres/)
  })

  it('inicia la sesión tras crear la cuenta', async () => {
    mockApi({ 'POST /api/auth/register': () => jsonResponse(ana, 201) })

    const { router } = renderRoute('/registro')
    await userEvent.type(await screen.findByLabelText('Nombre'), 'Ana')
    await userEvent.type(await screen.findByLabelText('Correo electrónico'), 'ana@example.org')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'una frase de prueba segura')
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(await (await header()).findByText('Ana')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/')
  })
})

describe('cierre de sesión', () => {
  it('vuelve a mostrar los enlaces de acceso', async () => {
    mockApi({
      'GET /api/auth/me': () => jsonResponse(ana),
      'POST /api/auth/logout': () => jsonResponse(null, 204),
    })

    renderRoute('/')
    await userEvent.click(await (await header()).findByRole('button', { name: 'Cerrar sesión' }))

    expect(await (await header()).findByRole('link', { name: 'Entrar' })).toBeInTheDocument()
  })
})

describe('safeReturnPath', () => {
  it.each([
    ['/contribuir', '/contribuir'],
    [null, '/'],
    ['https://sitio-malicioso.com', '/'],
    ['//sitio-malicioso.com', '/'],
    ['/\\sitio-malicioso.com', '/'],
  ])('%s → %s', (input, expected) => {
    expect(safeReturnPath(input)).toBe(expected)
  })
})
