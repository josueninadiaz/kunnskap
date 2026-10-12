import { Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, ScrollRestoration, useLocation } from 'react-router'
import { Container } from '../components/ui/Container'
import { Logo } from '../components/ui/Logo'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { AccountMenu } from '../features/auth/AccountMenu'
import { config } from '../lib/config'
import { CODE_LICENSE, CONTENT_LICENSE, ORIGINAL_ATTRIBUTION, sourceUrl } from '../lib/legal'

const navItems = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/cursos', label: 'Cursos', end: false },
  { to: '/contribuir', label: 'Contribuir', end: false },
] as const

function desktopLinkClass({ isActive }: { isActive: boolean }): string {
  return `rounded-full px-3.5 py-1.5 text-[0.9375rem] transition-colors ${
    isActive ? 'bg-surface-muted font-medium text-fg' : 'text-fg-muted hover:text-fg'
  }`
}

function mobileLinkClass({ isActive }: { isActive: boolean }): string {
  return `block rounded-(--radius-control) px-3 py-3 text-lg font-medium ${isActive ? 'bg-surface-muted text-fg' : 'text-fg'}`
}

export function RootLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const [lastPath, setLastPath] = useState(location.pathname)

  // Cierra el menú móvil al navegar (ajuste de estado durante el render, sin efecto).
  if (location.pathname !== lastPath) {
    setLastPath(location.pathname)
    setMenuOpen(false)
  }

  // Escape cierra el menú móvil.
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-surface focus:px-4 focus:py-2 focus:shadow-soft"
      >
        Saltar al contenido
      </a>

      <header className="sticky top-0 z-40 border-b border-border bg-header backdrop-blur-xl backdrop-saturate-150">
        <Container className="flex h-16 items-center justify-between gap-4">
          <Link to="/" className="rounded-md" aria-label={`${config.platformName}, inicio`}>
            <Logo />
          </Link>

          <nav aria-label="Principal" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {navItems.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} end={item.end} className={desktopLinkClass}>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <ThemeToggle />
            <AccountMenu />
          </div>

          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-full text-fg hover:bg-surface-muted md:hidden"
            aria-expanded={menuOpen}
            aria-controls="menu-movil"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X aria-hidden="true" className="size-5" /> : <Menu aria-hidden="true" className="size-5" />}
            <span className="sr-only">{menuOpen ? 'Cerrar menú' : 'Abrir menú'}</span>
          </button>
        </Container>

        {menuOpen ? (
          <div id="menu-movil" className="border-t border-border md:hidden">
            <Container className="space-y-5 py-5">
              <nav aria-label="Principal (móvil)">
                <ul className="space-y-1">
                  {navItems.map((item) => (
                    <li key={item.to}>
                      <NavLink to={item.to} end={item.end} className={mobileLinkClass}>
                        {item.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </nav>
              <div className="flex items-center justify-between border-t border-border pt-5">
                <span className="text-sm text-fg-muted">Apariencia</span>
                <ThemeToggle />
              </div>
              <AccountMenu stacked />
            </Container>
          </div>
        ) : null}
      </header>

      <main id="contenido" tabIndex={-1} className="flex-1 focus:outline-none">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-surface">
        <Container className="grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="max-w-sm space-y-4">
            <Logo />
            <p className="text-sm leading-relaxed text-fg-muted">
              Educación tecnológica gratuita y de código abierto, en español. No es una institución acreditada: sus cursos
              no equivalen a títulos universitarios ni garantizan un empleo.
            </p>
          </div>
          <nav aria-label="Aprender">
            <h2 className="eyebrow text-fg-muted">Aprender</h2>
            <ul className="mt-4 space-y-2.5 text-[0.9375rem]">
              <li>
                <Link to="/cursos" className="hover:text-accent">
                  Catálogo de cursos
                </Link>
              </li>
              <li>
                <Link to="/registro" className="hover:text-accent">
                  Crear una cuenta gratuita
                </Link>
              </li>
              <li>
                <Link to="/estado" className="hover:text-accent">
                  Estado del servicio
                </Link>
              </li>
            </ul>
          </nav>
          <nav aria-label="Proyecto">
            <h2 className="eyebrow text-fg-muted">Proyecto</h2>
            <ul className="mt-4 space-y-2.5 text-[0.9375rem]">
              <li>
                <Link to="/contribuir" className="hover:text-accent">
                  Cómo contribuir
                </Link>
              </li>
              <li>
                <Link to="/privacidad" className="hover:text-accent">
                  Privacidad
                </Link>
              </li>
              {sourceUrl ? (
                <li>
                  <a href={sourceUrl} className="hover:text-accent">
                    Código fuente
                  </a>
                </li>
              ) : null}
            </ul>
          </nav>
        </Container>
        <div className="border-t border-border">
          <Container className="flex flex-col gap-2 py-6 text-sm text-fg-muted md:flex-row md:justify-between">
            <p>{ORIGINAL_ATTRIBUTION}</p>
            <p>
              Código:{' '}
              <a className="underline hover:text-fg" href={CODE_LICENSE.url} rel="license">
                {CODE_LICENSE.name}
              </a>
              {' · '}Contenido:{' '}
              <a className="underline hover:text-fg" href={CONTENT_LICENSE.url} rel="license">
                {CONTENT_LICENSE.name}
              </a>
            </p>
          </Container>
        </div>
      </footer>

      <ScrollRestoration />
    </div>
  )
}
