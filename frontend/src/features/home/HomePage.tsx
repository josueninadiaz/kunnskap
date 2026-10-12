import {
  ArrowRight,
  BookOpenCheck,
  Brain,
  Code2,
  GraduationCap,
  Hammer,
  type LucideIcon,
  Server,
  ShieldCheck,
  Users,
  Wallet,
  Wifi,
} from 'lucide-react'
import { useEffect } from 'react'
import { Link } from 'react-router'
import { ButtonLink } from '../../components/ui/Button'
import { Container } from '../../components/ui/Container'
import { StatusMessage } from '../../components/ui/StatusMessage'
import { describeError } from '../../lib/api'
import { config } from '../../lib/config'
import { useCatalogFacets, useCourse } from '../catalog/catalogApi'
import { Terminal } from './Terminal'

/** Curso que se presenta en la portada. */
const FEATURED_COURSE = 'programar-desde-cero-con-csharp'

// Icono por escuela; las escuelas nuevas usan el icono genérico.
const schoolIcons: Record<string, LucideIcon> = {
  fundamentos: BookOpenCheck,
  'desarrollo-web': Code2,
  'backend-dotnet': Server,
  'inteligencia-artificial': Brain,
  ciberseguridad: ShieldCheck,
}

const principles = [
  {
    Icon: Wallet,
    title: 'Gratis de verdad',
    text: 'Los cursos, ejercicios y materiales esenciales no dependen de ningún pago ni suscripción.',
  },
  {
    Icon: Wifi,
    title: 'Para cualquier equipo',
    text: 'Páginas ligeras que funcionan en el móvil y con conexiones lentas. Cada lección se puede seguir leyendo, sin video.',
  },
  {
    Icon: Hammer,
    title: 'Aprender haciendo',
    text: 'Cada lección termina con una actividad práctica y cada ruta, con un proyecto real que puedes mostrar.',
  },
  {
    Icon: Users,
    title: 'A tu ritmo o acompañado',
    text: 'Estudia por tu cuenta cuando quieras o únete a una edición guiada con sesiones en vivo (en preparación).',
  },
] as const

const audience = [
  'Personas que nunca han programado y quieren empezar desde cero.',
  'Jóvenes que terminan el bachillerato y no pueden acceder a la universidad.',
  'Adultos que buscan una habilidad técnica para mejorar sus oportunidades.',
  'Autodidactas que necesitan una ruta ordenada y con proyectos.',
  'Educadores y profesionales que quieren enseñar o acompañar a otros.',
] as const

function courseCountLabel(published: number, inDevelopment: number): string {
  const parts: string[] = []
  if (published > 0) parts.push(published === 1 ? '1 curso disponible' : `${published} cursos disponibles`)
  if (inDevelopment > 0) parts.push(inDevelopment === 1 ? '1 en preparación' : `${inDevelopment} en preparación`)
  return parts.join(' · ') || 'Sin cursos todavía'
}

export function HomePage() {
  useEffect(() => {
    document.title = `${config.platformName} · Aprende tecnología gratis`
  }, [])

  return (
    <>
      <section aria-labelledby="hero-title" className="stage">
        <Container className="grid items-center gap-14 py-16 sm:py-24 lg:grid-cols-[1.1fr_1fr] lg:py-28">
          <div className="space-y-7">
            <p className="inline-flex items-center gap-2 rounded-full border border-stage-border px-3 py-1 text-sm text-stage-muted">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-stage-accent" />
              En construcción: el primer curso está en preparación
            </p>
            <h1 id="hero-title" className="display">
              Aprende a programar gratis, a tu ritmo y con proyectos reales.
            </h1>
            <p className="lead max-w-xl text-stage-muted">
              {config.platformName} es una plataforma educativa gratuita y de código abierto para aprender programación,
              desarrollo de software, inteligencia artificial y ciberseguridad. Sin experiencia previa, sin una computadora
              potente y sin pagar herramientas.
            </p>
            <div className="flex flex-wrap gap-3">
              <ButtonLink to="/cursos" variant="stage" size="lg">
                Ver el catálogo de cursos
              </ButtonLink>
              <ButtonLink to="/contribuir" variant="stage-secondary" size="lg">
                Quiero contribuir
              </ButtonLink>
            </div>
          </div>
          <Terminal />
        </Container>
      </section>

      <section aria-labelledby="principles-title" className="py-20 sm:py-28">
        <Container>
          <h2 id="principles-title" className="headline max-w-2xl">
            Cómo funciona
          </h2>
          <dl className="mt-12 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {principles.map(({ Icon, title, text }) => (
              <div key={title} className="space-y-3">
                <dt className="space-y-4">
                  <span className="inline-flex size-11 items-center justify-center rounded-full bg-accent-soft text-accent-soft-fg">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <span className="block text-lg font-semibold tracking-[-0.015em]">{title}</span>
                </dt>
                <dd className="text-fg-muted">{text}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <FeaturedCourse />

      <section id="areas" aria-labelledby="areas-title" className="py-20 sm:py-28">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl space-y-4">
              <h2 id="areas-title" className="headline">
                Qué podrás aprender
              </h2>
              <p className="lead text-fg-muted">
                Escuelas con rutas ordenadas de principiante a nivel profesional. Puedes seguir una ruta completa o elegir
                cursos sueltos.
              </p>
            </div>
            <Link to="/cursos" className="inline-flex items-center gap-1.5 font-medium text-accent hover:underline">
              Ver todos los cursos <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
          <div className="mt-12">
            <SchoolList />
          </div>
        </Container>
      </section>

      <section aria-labelledby="audience-title" className="border-y border-border bg-surface py-20 sm:py-28">
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          <h2 id="audience-title" className="headline">
            ¿Para quién es?
          </h2>
          <ul className="divide-y divide-border border-y border-border">
            {audience.map((a) => (
              <li key={a} className="py-4 text-lg tracking-[-0.01em]">
                {a}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section aria-labelledby="contribute-title" className="py-20 sm:py-28">
        <Container>
          <div className="stage flex flex-col items-start gap-6 rounded-[1.75rem] px-6 py-12 sm:px-12 sm:py-16 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <h2 id="contribute-title" className="headline">
                Construyámosla entre todos
              </h2>
              <p className="lead text-stage-muted">
                Si eres desarrollador, educador o simplemente quieres ayudar a revisar materiales, hay un lugar para ti.
              </p>
            </div>
            <ButtonLink to="/contribuir" variant="stage" size="lg">
              Cómo contribuir
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  )
}

/** Presentación editorial del curso destacado, con datos reales de la API. Se oculta si no existe. */
function FeaturedCourse() {
  const course = useCourse(FEATURED_COURSE)
  if (!course.data) return null
  const c = course.data
  const author = c.authors[0]

  return (
    <section aria-labelledby="featured-title" className="border-y border-border bg-surface py-20 sm:py-28">
      <Container className="grid gap-14 lg:grid-cols-[1fr_1fr] lg:gap-20">
        <div className="space-y-6">
          <p className="eyebrow text-accent">Primer curso{c.status === 'InDevelopment' ? ' · en preparación' : ''}</p>
          <h2 id="featured-title" className="headline">
            {c.title}
          </h2>
          <p className="lead text-fg-muted">{c.summary}</p>
          {author ? (
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="inline-flex size-12 items-center justify-center rounded-full bg-stage text-lg font-semibold text-stage-accent"
              >
                {author.charAt(0)}
              </span>
              <span>
                <span className="block text-sm text-fg-muted">Curso creado por</span>
                <span className="font-semibold">{author}</span>
              </span>
            </div>
          ) : null}
          <p className="text-fg-muted">
            Se impartirá en ediciones guiadas con sesiones en vivo y también se podrá seguir a tu ritmo con las lecciones
            escritas.
          </p>
          <ButtonLink to={`/cursos/${c.slug}`} size="lg">
            Ver el curso
          </ButtonLink>
        </div>
        <div>
          <h3 className="eyebrow text-fg-muted">Temario</h3>
          <ol className="mt-4 divide-y divide-border border-y border-border">
            {c.modules.map((m, i) => (
              <li key={m.title} className="flex items-baseline gap-5 py-4">
                <span className="w-6 shrink-0 font-mono text-sm text-fg-muted tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                <span className="text-lg font-medium tracking-[-0.01em]">{m.title}</span>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  )
}

function SchoolList() {
  const facets = useCatalogFacets()

  if (facets.isPending) return <StatusMessage tone="loading" title="Cargando las escuelas…" />
  if (facets.isError) {
    return (
      <StatusMessage tone="error" title="No se pudieron cargar las escuelas">
        {describeError(facets.error)} También puedes ir directamente al{' '}
        <Link to="/cursos" className="underline">
          catálogo
        </Link>
        .
      </StatusMessage>
    )
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {facets.data.schools.map((school) => {
        const Icon = schoolIcons[school.slug] ?? GraduationCap
        return (
          <li key={school.slug}>
            <Link
              to={`/cursos?escuela=${school.slug}`}
              className="group flex h-full flex-col gap-4 rounded-(--radius-panel) border border-border bg-surface p-6 transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-border-strong hover:shadow-soft"
            >
              <span className="inline-flex size-11 items-center justify-center rounded-full bg-accent-soft text-accent-soft-fg">
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <span className="text-xl font-semibold tracking-[-0.02em] group-hover:text-accent">{school.name}</span>
              <span className="text-[0.9375rem] text-fg-muted">{school.description}</span>
              <span className="mt-auto pt-2 text-sm font-medium text-fg-muted">
                {courseCountLabel(school.publishedCourses, school.coursesInDevelopment)}
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
