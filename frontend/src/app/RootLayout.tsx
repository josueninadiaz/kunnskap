import { NavLink, Outlet, ScrollRestoration } from 'react-router'
import { config } from '../lib/config'
import { CODE_LICENSE, CONTENT_LICENSE, ORIGINAL_ATTRIBUTION, sourceUrl } from '../lib/legal'

const navItems = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/contribuir', label: 'Contribuir', end: false },
  { to: '/estado', label: 'Estado', end: false },
] as const

function navLinkClass({ isActive }: { isActive: boolean }): string {
  return `rounded-(--radius-control) px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-accent-soft text-accent-soft-fg' : 'text-fg-muted hover:bg-surface-muted hover:text-fg'
  }`
}

export function RootLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-(--radius-control) focus:bg-surface focus:px-4 focus:py-2 focus:shadow"
      >
        Saltar al contenido
      </a>

      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-(--container-content) flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <NavLink to="/" className="flex items-center gap-2 py-2 font-semibold">
            <img src="/favicon.svg" alt="" width={28} height={28} />
            <span>{config.platformName}</span>
          </NavLink>
          <nav aria-label="Principal">
            <ul className="flex flex-wrap gap-1">
              {navItems.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} end={item.end} className={navLinkClass}>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main id="contenido" tabIndex={-1} className="mx-auto w-full max-w-(--container-content) flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto max-w-(--container-content) space-y-2 px-4 py-8 text-sm text-fg-muted sm:px-6">
          <p>
            {config.platformName} es un proyecto educativo gratuito y de código abierto. No es una institución
            acreditada: sus cursos y constancias no equivalen a títulos universitarios ni garantizan un empleo.
          </p>
          <p>{ORIGINAL_ATTRIBUTION}</p>
          <p>
            Código bajo licencia{' '}
            <a className="underline hover:text-fg" href={CODE_LICENSE.url} rel="license">
              {CODE_LICENSE.name}
            </a>
            {sourceUrl ? (
              <>
                {' '}
                (
                <a className="underline hover:text-fg" href={sourceUrl}>
                  código fuente
                </a>
                )
              </>
            ) : null}
            . Contenido educativo bajo licencia{' '}
            <a className="underline hover:text-fg" href={CONTENT_LICENSE.url} rel="license">
              {CONTENT_LICENSE.name}
            </a>
            , salvo que se indique otra cosa.
          </p>
        </div>
      </footer>

      <ScrollRestoration />
    </div>
  )
}
