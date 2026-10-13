import {
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
import { HelloEditor } from './HelloEditor'

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
  return parts.join(', ') || 'Sin cursos todavía'
}

export function HomePage() {
  useEffect(() => {
    document.title = `${config.platformName} · Aprende a programar gratis`
  }, [])

  return (
    <>
      <section aria-labelledby="hero-title" className="overflow-hidden">
        <Container className="flex flex-col items-center gap-8 pt-16 pb-20 text-center sm:pt-24 sm:pb-28">
          <p className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-sm text-fg-muted">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
            Primer curso en preparación
          </p>
          <h1 id="hero-title" className="display max-w-4xl">
            Tu primer programa empieza aquí.
          </h1>
          <p className="lead max-w-2xl text-fg-muted">
            {config.platformName} es una plataforma gratuita y de código abierto para aprender programación, desarrollo de
            software, inteligencia artificial y ciberseguridad. En español y desde cero.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <ButtonLink to={`/cursos/${FEATURED_COURSE}`} size="lg">
              Ver el primer curso
            </ButtonLink>
            <ButtonLink to="/cursos" variant="secondary" size="lg">
              Ver todos los cursos
            </ButtonLink>
          </div>
          <div className="mt-6 w-full">
            <HelloEditor />
          </div>
        </Container>
      </section>

      <FeaturedCourse />

      <section aria-labelledby="principles-title" className="py-20 sm:py-28">
        <Container>
          <h2 id="principles-title" className="headline max-w-2xl">
            Cómo funciona
          </h2>
          <dl className="mt-12 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {principles.map(({ Icon, title, text }) => (
              <div key={title} className="space-y-3">
                <dt className="space-y-3">
                  <Icon aria-hidden="true" className="size-6 text-accent" strokeWidth={1.75} />
                  <span className="block font-display text-xl font-semibold tracking-[-0.02em]">{title}</span>
                </dt>
                <dd className="text-fg-muted">{text}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <section id="areas" aria-labelledby="areas-title" className="bg-band py-20 sm:py-28">
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
            <Link to="/cursos" className="font-medium text-accent underline-offset-4 hover:underline">
              Ver todos los cursos
            </Link>
          </div>
          <div className="mt-12">
            <SchoolList />
          </div>
        </Container>
      </section>

      <section aria-labelledby="audience-title" className="py-20 sm:py-28">
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

      <section aria-labelledby="contribute-title" className="border-t border-border bg-band py-20 text-center sm:py-28">
        <Container className="flex flex-col items-center gap-6">
          <h2 id="contribute-title" className="headline max-w-2xl">
            Construyámosla entre todos
          </h2>
          <p className="lead max-w-xl text-fg-muted">
            Si eres desarrollador, educador o simplemente quieres ayudar a revisar materiales, hay un lugar para ti.
          </p>
          <ButtonLink to="/contribuir" size="lg">
            Cómo contribuir
          </ButtonLink>
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
    <section aria-labelledby="featured-title" className="border-y border-border bg-band py-20 sm:py-28">
      <Container className="grid gap-14 lg:grid-cols-[1fr_1fr] lg:gap-20">
        <div className="space-y-6">
          <p className="eyebrow text-accent">
            {c.status === 'InDevelopment' ? 'Primer curso, en preparación' : 'Primer curso'}
          </p>
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
                <span className="w-5 shrink-0 text-right text-fg-muted tabular-nums">{i + 1}</span>
                <span className="font-display text-xl font-medium tracking-[-0.015em]">{m.title}</span>
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
    <ul className="border-t border-border">
      {facets.data.schools.map((school) => {
        const Icon = schoolIcons[school.slug] ?? GraduationCap
        return (
          <li key={school.slug} className="border-b border-border">
            <Link
              to={`/cursos?escuela=${school.slug}`}
              className="group grid gap-x-10 gap-y-2 py-7 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_12rem] md:items-baseline"
            >
              <span className="flex items-baseline gap-3">
                <Icon aria-hidden="true" className="size-5 shrink-0 translate-y-0.5 text-accent" strokeWidth={1.75} />
                <span className="font-display text-2xl font-semibold tracking-[-0.025em] group-hover:text-accent sm:text-3xl">
                  {school.name}
                </span>
              </span>
              <span className="text-fg-muted md:pl-0 pl-8">{school.description}</span>
              <span className="pl-8 text-sm font-medium whitespace-nowrap text-fg-muted md:pl-0 md:text-right">
                {courseCountLabel(school.publishedCourses, school.coursesInDevelopment)}
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
