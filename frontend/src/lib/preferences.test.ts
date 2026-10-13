import { afterEach, describe, expect, it } from 'vitest'
import { defaultPreferences, getPreferencesSnapshot, prefersReducedMotion, readPreferences, setPreferences } from './preferences'

afterEach(() => {
  setPreferences(defaultPreferences)
  localStorage.clear()
})

describe('preferencias de lectura', () => {
  it('se aplican como atributos en <html> y se guardan', () => {
    setPreferences({ ...defaultPreferences, text: 'grande', font: 'legible', motion: 'reducido' })

    const root = document.documentElement
    expect(root.getAttribute('data-text')).toBe('grande')
    expect(root.getAttribute('data-font')).toBe('legible')
    expect(root.hasAttribute('data-spacing')).toBe(false)
    expect(readPreferences().text).toBe('grande')
    expect(getPreferencesSnapshot().font).toBe('legible')
    expect(prefersReducedMotion()).toBe(true)
  })

  it('volver a los valores por defecto quita los atributos', () => {
    setPreferences({ ...defaultPreferences, links: 'subrayados' })
    setPreferences(defaultPreferences)

    expect(document.documentElement.hasAttribute('data-links')).toBe(false)
  })

  it('ignora valores guardados que no son válidos', () => {
    localStorage.setItem('kunnskap.preferencias', JSON.stringify({ text: 'gigante', spacing: 'amplio' }))

    expect(readPreferences()).toEqual({ ...defaultPreferences, spacing: 'amplio' })
  })
})
