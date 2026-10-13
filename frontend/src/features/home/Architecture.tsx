import { Container } from '../../components/ui/Container'
import { sourceUrl } from '../../lib/legal'

const tiers = [
  {
    name: 'Tu navegador',
    tech: 'React 19 y TypeScript',
    detail: 'La web que estás viendo. Ligera, accesible y con modo claro y oscuro.',
  },
  {
    name: 'API',
    tech: 'ASP.NET Core en .NET 10',
    detail: 'C# con Minimal APIs, ASP.NET Core Identity, validación y protección antiforgery.',
  },
  {
    name: 'Datos',
    tech: 'Entity Framework Core y PostgreSQL',
    detail: 'Migraciones versionadas, restricciones en la base de datos y búsqueda sin tildes.',
  },
] as const

/** Flujo de datos animado entre capas (se detiene si se pide reducir el movimiento). */
function Connector() {
  return (
    <div aria-hidden="true" className="relative flex items-center justify-center lg:h-auto lg:w-16">
      <div className="h-10 w-px bg-stage-border lg:h-px lg:w-full" />
      <span className="absolute size-2 rounded-full bg-stage-accent shadow-[0_0_12px_var(--stage-accent)] motion-safe:animate-[flow-y_1.8s_linear_infinite] lg:motion-safe:animate-[flow-x_1.8s_linear_infinite]" />
    </div>
  )
}

/** «Así está construido Kunnskap»: la arquitectura real de la plataforma, como ejemplo de lo que se enseña. */
export function Architecture() {
  return (
    <section aria-labelledby="architecture-title" className="stage py-20 sm:py-28">
      <Container>
        <div className="max-w-3xl space-y-5">
          <h2 id="architecture-title" className="headline">
            Así está construido Kunnskap.
          </h2>
          <p className="lead text-stage-muted">
            La plataforma es un ejemplo real de lo que enseña. Su código es abierto: puedes leerlo, ejecutarlo en tu equipo y
            proponer mejoras.
          </p>
        </div>

        <ol className="mt-14 flex flex-col items-stretch lg:flex-row lg:items-stretch">
          {tiers.map((tier, index) => (
            <li key={tier.name} className="contents">
              {index > 0 ? <Connector /> : null}
              <div className="flex-1 space-y-3 rounded-[1.25rem] border border-stage-border bg-stage-raised p-6">
                <p className="text-sm text-stage-muted">{tier.name}</p>
                <p className="font-display text-2xl font-semibold tracking-[-0.025em]">{tier.tech}</p>
                <p className="text-[0.9375rem] text-stage-muted">{tier.detail}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-[1.25rem] border border-stage-border p-6">
            <p className="text-sm text-stage-muted">Orquestación y observabilidad</p>
            <p className="mt-2 font-display text-xl font-semibold tracking-[-0.02em]">.NET Aspire y OpenTelemetry</p>
            <p className="mt-2 text-[0.9375rem] text-stage-muted">
              Un comando levanta la base de datos, la API y la web, con trazas y métricas en un panel.
            </p>
          </div>
          <div className="rounded-[1.25rem] border border-stage-border p-6">
            <p className="text-sm text-stage-muted">Código abierto y calidad</p>
            <p className="mt-2 font-display text-xl font-semibold tracking-[-0.02em]">GitHub, Actions y Codespaces</p>
            <p className="mt-2 text-[0.9375rem] text-stage-muted">
              Pruebas automáticas en cada cambio y un entorno listo para programar desde el navegador.
            </p>
          </div>
        </div>

        {sourceUrl ? (
          <a
            href={sourceUrl}
            className="mt-10 inline-flex min-h-12 items-center rounded-full bg-stage-accent px-6 font-medium text-stage transition-colors hover:bg-stage-fg"
          >
            Ver el código en GitHub
          </a>
        ) : null}
      </Container>
    </section>
  )
}
