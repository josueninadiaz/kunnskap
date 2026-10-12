import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// - defaultHidden: evita calcular la visibilidad (getComputedStyle) de cada nodo en las consultas por
//   rol, muy costoso en jsdom; aquí no aporta nada porque jsdom no aplica el CSS de Tailwind.
// - asyncUtilTimeout: margen para máquinas lentas o con la batería ejecutándose en paralelo.
configure({ defaultHidden: true, asyncUtilTimeout: 10_000 })

// jsdom no implementa el desplazamiento; ScrollRestoration de React Router lo invoca.
window.scrollTo = vi.fn<(...args: unknown[]) => void>() as unknown as typeof window.scrollTo

afterEach(() => {
  cleanup()
})
