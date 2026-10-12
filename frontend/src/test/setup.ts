import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// jsdom no implementa el desplazamiento; ScrollRestoration de React Router lo invoca.
window.scrollTo = vi.fn<(...args: unknown[]) => void>() as unknown as typeof window.scrollTo

afterEach(() => {
  cleanup()
})
