import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { apiCalls, jsonResponse, mockApi, renderRoute } from '../../test/render'

describe('página de estado', () => {
  it('muestra el estado de carga y después el éxito', async () => {
    const fetchMock = mockApi({ 'GET /api/health': () => jsonResponse({ status: 'ok', database: true }) })

    renderRoute('/estado')

    expect(await screen.findByText('Comprobando el estado…')).toBeInTheDocument()
    expect(await screen.findByText('Todo funciona correctamente')).toBeInTheDocument()
    expect(apiCalls(fetchMock)).toContain('GET /api/health')
  })

  it('distingue una base de datos caída (503) de un error de red', async () => {
    mockApi({ 'GET /api/health': () => jsonResponse({ status: 'degraded', database: false }, 503) })

    renderRoute('/estado')

    expect(await screen.findByRole('alert')).toHaveTextContent('Servicio degradado')
  })

  it('muestra un error comprensible sin conexión y permite reintentar', async () => {
    let attempts = 0
    mockApi({
      'GET /api/health': () => {
        attempts += 1
        if (attempts === 1) throw new TypeError('Failed to fetch')
        return jsonResponse({ status: 'ok', database: true })
      },
    })

    renderRoute('/estado')

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('No se pudo conectar con el servidor')

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByText('Todo funciona correctamente')).toBeInTheDocument()
    expect(attempts).toBe(2)
  })
})
