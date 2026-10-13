import { describe, expect, it } from 'vitest'
import { readableText, speechChunks } from './speech'

describe('lectura en voz alta', () => {
  it('cambia los bloques de código por un aviso y omite lo marcado', () => {
    const div = document.createElement('div')
    div.innerHTML = '<p>Escribe esto</p><pre><code>Console.WriteLine("Hola");</code></pre><nav data-no-speech>Siguiente</nav>'

    const text = readableText(div)

    expect(text).toContain('Escribe esto')
    expect(text).toContain('Bloque de código')
    expect(text).not.toContain('Console')
    expect(text).not.toContain('Siguiente')
  })

  it('divide el texto en trozos de unas pocas frases', () => {
    const text = 'Primera frase. '.repeat(40)

    const parts = speechChunks(text)

    expect(parts.length).toBeGreaterThan(1)
    expect(parts.every((p) => p.length <= 240)).toBe(true)
    expect(parts.join(' ').replace(/\s+/g, ' ')).toBe(text.trim().replace(/\s+/g, ' '))
  })
})
