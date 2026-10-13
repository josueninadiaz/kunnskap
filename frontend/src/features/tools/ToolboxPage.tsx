import { useState } from 'react'
import { Link } from 'react-router'
import { PageHeader } from '../../components/ui/PageHeader'
import { directories, LAST_CHECKED, publicApis, type Tool, toolGroups } from './toolbox'

const dateFormat = new Intl.DateTimeFormat('es', { dateStyle: 'long', timeZone: 'UTC' })

function ToolLink({ tool }: { tool: Tool }) {
  const internal = tool.url.startsWith('/')
  const className = 'font-display text-lg font-semibold tracking-[-0.015em] text-accent hover:underline'
  return internal ? (
    <Link to={tool.url} className={className}>
      {tool.name}
    </Link>
  ) : (
    <a href={tool.url} target="_blank" rel="noopener noreferrer" className={className}>
      {tool.name}
      <span className="sr-only"> (se abre en otra pestaña)</span>
    </a>
  )
}

/** Normaliza para buscar sin distinguir tildes ni mayúsculas. */
const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

export function ToolboxPage() {
  const [query, setQuery] = useState('')
  const q = normalize(query.trim())
  const apis = q
    ? publicApis.filter((api) => normalize(`${api.name} ${api.description} ${api.idea} ${api.category}`).includes(q))
    : publicApis

  return (
    <div className="space-y-16">
      <PageHeader
        title="Caja de herramientas"
        description="Recursos gratuitos que te ayudan a aprender y a construir tus propios proyectos. Elegidos y comprobados para quien empieza."
      />

      {toolGroups.map((group) => (
        <section key={group.id} aria-labelledby={`grupo-${group.id}`} className="grid gap-8 lg:grid-cols-[18rem_1fr] lg:gap-16">
          <div className="space-y-2">
            <h2 id={`grupo-${group.id}`} className="text-2xl font-semibold tracking-[-0.025em]">
              {group.title}
            </h2>
            <p className="text-fg-muted">{group.intro}</p>
          </div>
          <ul className="divide-y divide-border border-y border-border">
            {group.tools.map((tool) => (
              <li key={tool.name} className="grid gap-1 py-4 sm:grid-cols-[16rem_1fr] sm:gap-6">
                <div className="flex flex-wrap items-baseline gap-2">
                  <ToolLink tool={tool} />
                  {tool.microsoft ? (
                    <span className="rounded-full bg-dotnet/10 px-2 py-0.5 text-xs font-medium text-dotnet-text">Microsoft</span>
                  ) : null}
                </div>
                <p className="text-fg-muted">{tool.description}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section aria-labelledby="apis" className="space-y-8">
        <div className="max-w-2xl space-y-3">
          <h2 id="apis" className="headline">
            APIs públicas para tus proyectos
          </h2>
          <p className="lead text-fg-muted">
            Una API es un servicio que tu programa puede consultar para obtener datos reales. Estas son gratuitas, no piden
            clave y funcionan desde una página web. Pulsa «Probar» para ver la respuesta en tu navegador.
          </p>
        </div>

        <div className="max-w-md space-y-1.5">
          <label htmlFor="buscar-apis" className="block text-sm font-medium text-fg-muted">
            Buscar una API
          </label>
          <input
            id="buscar-apis"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Por ejemplo: tiempo, monedas, juegos…"
            className="block min-h-12 w-full rounded-full border border-border-strong bg-surface px-5 text-base text-fg placeholder:text-fg-muted"
          />
        </div>

        <p aria-live="polite" className="text-sm text-fg-muted">
          {apis.length === 1 ? '1 API' : `${apis.length} APIs`}
        </p>

        {apis.length === 0 ? (
          <p className="rounded-(--radius-panel) border border-border bg-surface p-6 text-fg-muted">
            Ninguna API coincide. Prueba con otra palabra o explora los directorios de abajo.
          </p>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {apis.map((api) => (
              <li key={api.name} className="flex flex-col gap-3 rounded-(--radius-panel) border border-border bg-surface p-6">
                <p className="text-sm text-fg-muted">{api.category}</p>
                <h3 className="text-xl font-semibold tracking-[-0.02em]">{api.name}</h3>
                <p className="text-[0.9375rem] text-fg-muted">{api.description}</p>
                <p className="text-[0.9375rem]">
                  <span className="font-semibold">Idea de proyecto:</span> {api.idea}
                </p>
                {api.note ? <p className="text-sm text-warning">{api.note}</p> : null}
                <div className="mt-auto flex flex-wrap gap-4 pt-2 text-[0.9375rem] font-medium">
                  <a href={api.example} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                    Probar<span className="sr-only"> {api.name} (se abre en otra pestaña)</span>
                  </a>
                  <a href={api.docs} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                    Documentación<span className="sr-only"> de {api.name} (se abre en otra pestaña)</span>
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="mas" className="grid gap-8 lg:grid-cols-[18rem_1fr] lg:gap-16">
        <div className="space-y-2">
          <h2 id="mas" className="text-2xl font-semibold tracking-[-0.025em]">
            ¿Quieres más?
          </h2>
          <p className="text-fg-muted">Directorios con cientos de APIs públicas, mantenidos por la comunidad.</p>
        </div>
        <ul className="divide-y divide-border border-y border-border">
          {directories.map((d) => (
            <li key={d.name} className="grid gap-1 py-4 sm:grid-cols-[16rem_1fr] sm:gap-6">
              <ToolLink tool={d} />
              <p className="text-fg-muted">{d.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-sm text-fg-muted">
        Enlaces comprobados el {dateFormat.format(new Date(LAST_CHECKED))}. Los servicios externos pueden cambiar sus
        condiciones; si alguno deja de funcionar, avísanos. Kunnskap no está afiliado a ninguno de ellos.
      </p>
    </div>
  )
}
