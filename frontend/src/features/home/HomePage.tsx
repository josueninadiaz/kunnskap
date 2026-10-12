import { BookOpenCheck, Brain, Code2, Server, ShieldCheck } from 'lucide-react'
import { useEffect } from 'react'
import { ButtonLink } from '../../components/ui/Button'
import { config } from '../../lib/config'

/*
 * Descripción de las áreas planificadas. No es el catálogo: los cursos se servirán desde la API
 * (fase 2). Aquí solo se indica, con honestidad, en qué estado está cada área.
 */
const areas = [
  {
    icon: BookOpenCheck,
    title: 'Fundamentos digitales y programación',
    description: 'Uso del ordenador para desarrollar, programar desde cero con C# y .NET, Git y GitHub.',
    project: 'Un primer programa documentado y publicado en un repositorio propio.',
    status: 'Primera ruta · en preparación',
  },
  {
    icon: Code2,
    title: 'Desarrollo web',
    description: 'HTML semántico y accesible, CSS adaptable, JavaScript, React con TypeScript, APIs y pruebas.',
    project: 'Una aplicación web útil, accesible y publicada, con documentación.',
    status: 'Planificada',
  },
  {
    icon: Server,
    title: 'Backend con C# y .NET',
    description: 'C#, orientación a objetos, SQL, Entity Framework Core, ASP.NET Core, seguridad y pruebas.',
    project: 'Una API completa con PostgreSQL, autenticación, pruebas y despliegue.',
    status: 'Planificada',
  },
  {
    icon: Brain,
    title: 'Inteligencia artificial aplicada',
    description: 'Python, análisis de datos, APIs de IA, prompts, búsqueda semántica, RAG y uso responsable.',
    project: 'Un asistente educativo que responde con fuentes citadas y reconoce lo que no sabe.',
    status: 'Planificada',
  },
  {
    icon: ShieldCheck,
    title: 'Ciberseguridad defensiva',
    description: 'Redes, Linux, autenticación, seguridad web, registros, vulnerabilidades e incidentes.',
    project: 'Un laboratorio defensivo autorizado con un informe de detección y mitigación.',
    status: 'Planificada',
  },
] as const

const audience = [
  'Personas que nunca han programado y quieren empezar desde cero.',
  'Jóvenes que terminan el bachillerato y no pueden acceder a la universidad.',
  'Adultos que buscan una habilidad técnica para mejorar sus oportunidades.',
  'Autodidactas que necesitan una ruta ordenada y con proyectos.',
  'Educadores y profesionales que quieren enseñar o acompañar a otros.',
] as const

const principles = [
  {
    title: 'Gratis de verdad',
    text: 'Los cursos, ejercicios y materiales esenciales no dependen de ningún pago ni suscripción.',
  },
  {
    title: 'Pensada para equipos modestos',
    text: 'Páginas ligeras que funcionan en el móvil y con conexiones lentas. Cada lección se puede seguir leyendo, sin necesidad de video.',
  },
  {
    title: 'A tu ritmo o con acompañamiento',
    text: 'Puedes estudiar por tu cuenta cuando quieras o unirte a una edición guiada con sesiones en vivo (en preparación).',
  },
  {
    title: 'Aprender haciendo',
    text: 'Cada ruta termina con un proyecto real que puedes mostrar y explicar.',
  },
  {
    title: 'Abierta',
    text: 'El código y el contenido son abiertos: cualquiera puede revisarlos, reutilizarlos y mejorarlos.',
  },
] as const

export function HomePage() {
  useEffect(() => {
    document.title = `${config.platformName} · Aprende tecnología gratis`
  }, [])

  return (
    <div className="space-y-20">
      <section aria-labelledby="hero-title" className="max-w-3xl space-y-6">
        <p className="text-sm font-medium tracking-wide text-accent uppercase">Educación tecnológica abierta</p>
        <h1 id="hero-title" className="text-4xl sm:text-5xl">
          Aprende a programar gratis, a tu ritmo y con proyectos reales.
        </h1>
        <p className="text-lg text-fg-muted">
          {config.platformName} es una plataforma educativa gratuita y de código abierto para aprender programación,
          desarrollo de software, inteligencia artificial y ciberseguridad. No necesitas experiencia previa, una
          computadora potente ni dinero para herramientas.
        </p>
        <p className="rounded-(--radius-panel) border border-warning/40 bg-warning-soft px-4 py-3 text-sm">
          <strong className="font-semibold">Estado del proyecto:</strong> estamos construyendo la plataforma y
          preparando la primera ruta, <em>Programación desde cero</em>. Todavía no hay cursos abiertos a inscripción.
        </p>
        <div className="flex flex-wrap gap-3">
          <ButtonLink to={{ hash: '#areas' }}>Ver qué podrás aprender</ButtonLink>
          <ButtonLink to="/contribuir" variant="secondary">
            Quiero contribuir
          </ButtonLink>
        </div>
      </section>

      <section aria-labelledby="principles-title" className="space-y-6">
        <h2 id="principles-title" className="text-2xl">
          Cómo funciona
        </h2>
        <dl className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
          {principles.map((p) => (
            <div key={p.title} className="border-l-2 border-accent pl-4">
              <dt className="font-semibold">{p.title}</dt>
              <dd className="mt-1 text-fg-muted">{p.text}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="audience-title" className="space-y-6">
        <h2 id="audience-title" className="text-2xl">
          ¿Para quién es?
        </h2>
        <ul className="max-w-(--container-prose) list-disc space-y-2 pl-5 marker:text-accent">
          {audience.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </section>

      <section id="areas" aria-labelledby="areas-title" className="scroll-mt-6 space-y-6">
        <div className="space-y-2">
          <h2 id="areas-title" className="text-2xl">
            Qué podrás aprender
          </h2>
          <p className="max-w-(--container-prose) text-fg-muted">
            Cinco escuelas con rutas ordenadas de principiante a nivel profesional. Puedes seguir una ruta completa o
            elegir cursos sueltos. El catálogo de cursos aparecerá aquí cuando se publique.
          </p>
        </div>
        <ul className="divide-y divide-border rounded-(--radius-panel) border border-border bg-surface">
          {areas.map(({ icon: Icon, title, description, project, status }) => (
            <li key={title} className="flex flex-col gap-3 p-5 sm:flex-row sm:gap-5">
              <Icon aria-hidden="true" className="size-6 shrink-0 text-accent" />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="text-lg">{title}</h3>
                  <span className="text-xs font-medium text-fg-muted">{status}</span>
                </div>
                <p className="text-fg-muted">{description}</p>
                <p className="text-sm">
                  <span className="font-medium">Proyecto de la ruta:</span> {project}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="contribute-title" className="space-y-4 rounded-(--radius-panel) bg-accent-soft p-6 sm:p-8">
        <h2 id="contribute-title" className="text-2xl text-accent-soft-fg">
          Construyámosla entre todos
        </h2>
        <p className="max-w-(--container-prose)">
          Si eres desarrollador, educador o simplemente quieres ayudar a revisar materiales, hay un lugar para ti.
        </p>
        <ButtonLink to="/contribuir">Cómo contribuir</ButtonLink>
      </section>
    </div>
  )
}
