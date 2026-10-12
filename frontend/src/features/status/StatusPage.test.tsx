import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { jsonResponse, renderRoute } from '../../test/render'

describe('página de estado', () => {
  it('muestra el estado de carga y después el éxito', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ status: 'ok', database: true }))

    renderRoute('/estado')

    expect(screen.getByRole('status')).toHaveTextContent('Comprobando el estado')
    expect(await screen.findByText('Todo funciona correctamente')).toBeInTheDocument()
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/health', expect.objectContaining({ method: 'GET' }))
  })

  it('distingue una base de datos caída (503) de un error de red', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ status: 'degraded', database: false }, 503))

    renderRoute('/estado')

    expect(await screen.findByRole('alert')).toHaveTextContent('Servicio degradado')
  })

  it('muestra un error comprensible sin conexión y permite reintentar', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(jsonResponse({ status: 'ok', database: true }))

    renderRoute('/estado')

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('No se pudo conectar con el servidor')

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByText('Todo funciona correctamente')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
