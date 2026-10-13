import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { mockApi, renderRoute } from '../../test/render'
import { sanitizeName } from './helloProgram'

describe('editor de la portada', () => {
  it('muestra al instante lo que imprimiría el programa con el nombre escrito', async () => {
    mockApi()
    renderRoute('/')

    const input = await screen.findByLabelText('Escribe tu nombre en el código')
    expect(screen.getByText('¡Hola, Ana!', { selector: 'output' })).toBeInTheDocument()

    await userEvent.clear(input)
    await userEvent.type(input, 'Josué')

    expect(screen.getByText('¡Hola, Josué!', { selector: 'output' })).toBeInTheDocument()
  })

  it('no permite caracteres que romperían la cadena de C#', async () => {
    mockApi()
    renderRoute('/')

    const input = await screen.findByLabelText('Escribe tu nombre en el código')
    await userEvent.clear(input)
    await userEvent.type(input, 'A"n\\a')

    expect(input).toHaveValue('Ana')
  })
})

describe('sanitizeName', () => {
  it.each([
    ['Ana', 'Ana'],
    ['Jo"sué', 'Josué'],
    ['a\\b', 'ab'],
    ['línea\nnueva', 'líneanueva'],
    ['x'.repeat(40), 'x'.repeat(24)],
  ])('%s → %s', (input, expected) => {
    expect(sanitizeName(input)).toBe(expected)
  })
})
