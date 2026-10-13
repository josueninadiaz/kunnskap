/**
 * Texto que se leerá en voz alta: el de la lección, cambiando los bloques de código por un aviso
 * (leer símbolos uno a uno no ayuda) y omitiendo lo marcado con data-no-speech.
 */
export function readableText(container: HTMLElement): string {
  const clone = container.cloneNode(true) as HTMLElement
  clone.querySelectorAll('[data-no-speech]').forEach((el) => el.remove())
  clone.querySelectorAll('pre').forEach((pre) => pre.replaceWith(' Bloque de código, puedes verlo en pantalla. '))
  clone.querySelectorAll('h1, h2, h3, li, p').forEach((el) => el.append('. '))
  return (clone.textContent ?? '').replace(/\s+/g, ' ').replace(/(\.\s*){2,}/g, '. ').trim()
}

/** Trozos de unas pocas frases: algunos navegadores cortan las locuciones muy largas. */
export function speechChunks(text: string): string[] {
  const sentences = text.match(/[^.!?¿¡]+[.!?]*\s*/g) ?? [text]
  const result: string[] = []
  let current = ''
  for (const sentence of sentences) {
    if ((current + sentence).length > 220 && current) {
      result.push(current.trim())
      current = ''
    }
    current += sentence
  }
  if (current.trim()) result.push(current.trim())
  return result
}
