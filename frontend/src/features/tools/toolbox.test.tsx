import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { mockApi, renderRoute } from '../../test/render'
import { publicApis } from './toolbox'

describe('caja de herramientas', () => {
  it('lista las APIs y busca sin distinguir tildes', async () => {
    mockApi()
    renderRoute('/herramientas')

    expect(await screen.findByText(`${publicApis.length} APIs`)).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Buscar una API'), 'monedas')

    expect(screen.getByText('1 API')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Frankfurter' })).toBeInTheDocument()
  })

  it('todas las APIs usan HTTPS y tienen idea de proyecto', () => {
    for (const api of publicApis) {
      expect(api.example.startsWith('https://')).toBe(true)
      expect(api.docs.startsWith('https://')).toBe(true)
      expect(api.idea.length).toBeGreaterThan(10)
    }
  })
})

describe('accesibilidad', () => {
  it('explica qué hay para personas sordas y para quien no habla', async () => {
    mockApi()
    renderRoute('/accesibilidad')

    expect(await screen.findByRole('heading', { level: 1, name: 'Accesibilidad e inclusión' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /sorda/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /no hablas/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Lo que todavía no ofrecemos' })).toBeInTheDocument()
  })
})
