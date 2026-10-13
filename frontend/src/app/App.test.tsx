import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { config } from '../lib/config'
import { ORIGINAL_ATTRIBUTION } from '../lib/legal'
import { mockApi, renderRoute } from '../test/render'

describe('aplicación', () => {
  beforeEach(() => {
    mockApi()
  })

  it('muestra la página de inicio con el nombre configurable y el aviso de no acreditación', async () => {
    renderRoute('/')

    expect(await screen.findByRole('heading', { level: 1, name: 'Aprende a programar con C# y .NET. Gratis y desde cero.' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: new RegExp(config.platformName) })).toHaveAttribute('href', '/')
    expect(screen.getByText(/no es una institución acreditada/i)).toBeInTheDocument()
  })

  it('muestra la atribución al autor original y la licencia AGPL en el pie (exigido por NOTICE.md)', () => {
    renderRoute('/')

    const footer = screen.getByRole('contentinfo')
    expect(footer).toHaveTextContent(ORIGINAL_ATTRIBUTION)
    expect(screen.getByRole('link', { name: 'GNU AGPL-3.0' })).toHaveAttribute(
      'href',
      'https://www.gnu.org/licenses/agpl-3.0.html',
    )
  })

  it('ofrece un enlace para saltar al contenido principal', () => {
    renderRoute('/')

    const skip = screen.getByRole('link', { name: 'Saltar al contenido' })
    expect(skip).toHaveAttribute('href', '#contenido')
    expect(document.getElementById('contenido')?.tagName).toBe('MAIN')
  })

  it('navega a la página de contribución desde el menú principal', async () => {
    renderRoute('/')
    const nav = screen.getByRole('navigation', { name: 'Principal' })

    await userEvent.click(nav.querySelector('a[href="/contribuir"]') as HTMLElement)

    expect(await screen.findByRole('heading', { level: 1, name: 'Cómo contribuir' })).toBeInTheDocument()
  })

  it('muestra una página 404 para rutas desconocidas', () => {
    renderRoute('/no-existe')

    expect(screen.getByRole('heading', { level: 1, name: 'Página no encontrada' })).toBeInTheDocument()
  })
})
