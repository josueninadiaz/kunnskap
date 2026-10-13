import {
  BookOpenCheck,
  Ear,
  Keyboard,
  MessageSquareText,
  Type,
  Volume2,
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
import dotnetLogo from '../../assets/brand/dotnet-logo.svg'
import { Architecture } from './Architecture'
import { Constellation } from './constellation/Constellation'
import { HelloEditor } from './HelloEditor'
import { MicrosoftStack } from './MicrosoftStack'
import { NordicLandscape } from './NordicLandscape'

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

const steps = [
  {
    title: 'Elige por dónde empezar',
    text: 'Si nunca has programado, empieza por «Programar desde cero con C#». Si ya sabes algo, explora el catálogo.',
  },
  {
    title: 'Aprende a tu manera',
    text: 'Lee o escucha cada lección, haz la actividad práctica y comprueba lo aprendido. No hay prisa ni exámenes sorpresa.',
  },
  {
    title: 'Guarda tu progreso',
    text: 'Con una cuenta gratuita, la plataforma recuerda dónde lo dejaste. Es opcional: puedes leer sin registrarte.',
  },
] as const

const inclusion = [
  { Icon: Ear, title: 'Sin necesidad de oír', text: 'Todo es texto, y los videos llevan transcripción completa.' },
  { Icon: MessageSquareText, title: 'Sin necesidad de hablar', text: 'Nada pide micrófono; en las sesiones en vivo participas por chat.' },
  { Icon: Volume2, title: 'Escucha las lecciones', text: 'Lectura en voz alta con un botón, a la velocidad que prefieras.' },
  { Icon: Type, title: 'Lee con comodidad', text: 'Texto más grande, más espacio y una tipografía de alta legibilidad.' },
  { Icon: Keyboard, title: 'Con teclado o lector de pantalla', text: 'Navegación completa por teclado y compatible con lectores de pantalla.' },
  { Icon: Wifi, title: 'Con cualquier conexión', text: 'Páginas ligeras y la opción de programar desde el navegador.' },
] as const

const faq = [
  {
    q: '¿De verdad es gratis?',
    a: 'Sí. Los cursos, las lecciones y los ejercicios son gratuitos y lo seguirán siendo. El código de la plataforma es abierto: cualquiera puede comprobarlo.',
  },
  {
    q: '¿Necesito saber matemáticas o inglés?',
    a: 'No para empezar. Basta con las operaciones básicas, y todo está en español. Las pocas palabras en inglés que usa C#, como «WriteLine», se explican en las lecciones.',
  },
  {
    q: '¿Necesito una computadora potente?',
    a: 'No. Cualquier computadora sencilla sirve, y si no puedes instalar programas, puedes programar desde el navegador con GitHub Codespaces. Las lecciones también se pueden leer en el teléfono.',
  },
  {
    q: '¿Y si me atasco?',
    a: 'Es parte de aprender. Cada curso enseña a leer los errores y a buscar ayuda. Además, habrá ediciones guiadas con sesiones en vivo y estamos preparando un espacio de preguntas por curso.',
  },
  {
    q: '¿Tengo alguna discapacidad, puedo aprender aquí?',
    a: 'Sí, y queremos que te resulte cómodo. Puedes ajustar el texto, escuchar las lecciones y usar lector de pantalla. Si encuentras una barrera, cuéntanoslo y la arreglaremos.',
  },
  {
    q: '¿Me darán un título?',
    a: 'No. Kunnskap no es una universidad ni una institución acreditada. Lo que te llevas son habilidades reales y proyectos que puedes mostrar a quien quieras.',
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
    document.title = `${config.platformName} · Aprende a programar con C# y .NET, gratis`
  }, [])

  return (
    <>
      <section aria-labelledby="hero-title" className="stage relative overflow-hidden">
        <Container className="relative z-10 grid items-center gap-10 pt-14 pb-28 sm:pt-20 sm:pb-40 lg:grid-cols-[1fr_1.1fr] lg:gap-6">
          <div className="space-y-7">
            <div className="space-y-1">
              <p lang="no" className="font-display text-3xl font-semibold tracking-[-0.02em] text-stage-accent">
                Velkommen.
              </p>
              <p className="text-sm text-stage-muted">
                Así se da la bienvenida en noruego. Nuestro nombre, Kunnskap, significa «conocimiento».
              </p>
            </div>
            <h1 id="hero-title" className="display">
              Programar también es para ti.
            </h1>
            <p className="lead max-w-xl text-stage-muted">
              Aprende C# y .NET, la tecnología de Microsoft, y también desarrollo web, inteligencia artificial y
              ciberseguridad. Gratis, en español, a tu ritmo y con ayuda cuando la necesites.
            </p>
            <div className="flex flex-wrap gap-3">
              <ButtonLink to={`/cursos/${FEATURED_COURSE}`} variant="stage" size="lg">
                Empezar con C#
              </ButtonLink>
              <ButtonLink to="/cursos" variant="stage-secondary" size="lg">
                Ver todos los cursos
              </ButtonLink>
            </div>
            <p className="inline-flex items-center gap-2.5 rounded-full border border-stage-border bg-stage-raised/60 py-1 pr-3.5 pl-1.5 text-sm text-stage-muted">
              <img src={dotnetLogo} alt="" width={24} height={24} className="size-6 rounded-full" />
              Hecho con .NET 10 y código abierto
            </p>
          </div>
          <div className="space-y-3">
            <Constellation />
            <p className="text-center text-sm text-stage-muted">
              Gira la constelación: cada punto es un curso y cada etiqueta, una tecnología.
            </p>
          </div>
        </Container>
        <NordicLandscape />
      </section>

      <section aria-labelledby="steps-title" className="py-20 sm:py-28">
        <Container>
          <h2 id="steps-title" className="headline max-w-2xl">
            Empieza en tres pasos. Sin prisa y sin miedo.
          </h2>
          <ol className="mt-12 grid gap-10 md:grid-cols-3">
            {steps.map((step, i) => (
              <li key={step.title} className="space-y-3">
                <span
                  aria-hidden="true"
                  className="inline-flex size-11 items-center justify-center rounded-full bg-cloudberry font-display text-lg font-semibold text-stage"
                >
                  {i + 1}
                </span>
                <h3 className="text-xl font-semibold tracking-[-0.02em]">{step.title}</h3>
                <p className="text-fg-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section aria-labelledby="try-title" className="bg-band py-20 sm:py-28">
        <Container className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div className="space-y-5">
            <h2 id="try-title" className="headline">
              Pruébalo ahora: este es tu primer programa.
            </h2>
            <p className="lead text-fg-muted">
              Cambia el nombre dentro del código y mira lo que imprime. Así de corto es un programa en C# con .NET 10: un
              archivo y un comando.
            </p>
            <dl className="grid gap-x-8 gap-y-6 pt-4 sm:grid-cols-2">
              {principles.map(({ Icon, title, text }) => (
                <div key={title} className="space-y-1.5">
                  <dt className="flex items-center gap-2 font-semibold">
                    <Icon aria-hidden="true" className="size-5 text-accent" strokeWidth={1.75} />
                    {title}
                  </dt>
                  <dd className="text-[0.9375rem] text-fg-muted">{text}</dd>
                </div>
              ))}
            </dl>
          </div>
          <HelloEditor />
        </Container>
      </section>

      <section aria-labelledby="inclusion-title" className="py-20 sm:py-28">
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-20">
          <div className="space-y-5">
            <h2 id="inclusion-title" className="headline">
              Aprender sin barreras.
            </h2>
            <p className="lead text-fg-muted">
              Aquí nadie se queda fuera. Ajusta la web a tu manera y aprende como mejor te funcione: leyendo, escuchando o a
              tu ritmo.
            </p>
            <div className="flex flex-wrap gap-3">
              <ButtonLink to="/accesibilidad" variant="secondary" size="lg">
                Accesibilidad e inclusión
              </ButtonLink>
            </div>
          </div>
          <ul className="grid gap-x-8 gap-y-8 sm:grid-cols-2">
            {inclusion.map(({ Icon, title, text }) => (
              <li key={title} className="space-y-2">
                <p className="flex items-center gap-2.5 font-semibold">
                  <span className="inline-flex size-9 items-center justify-center rounded-full bg-accent-soft text-accent-soft-fg">
                    <Icon aria-hidden="true" className="size-[1.125rem]" />
                  </span>
                  {title}
                </p>
                <p className="text-[0.9375rem] text-fg-muted">{text}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <MicrosoftStack />

      <FeaturedCourse />

      <Architecture />

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
            <Link to="/cursos" className="font-medium text-accent underline-offset-4 hover:underline">
              Ver todos los cursos
            </Link>
          </div>
          <div className="mt-12">
            <SchoolList />
          </div>
        </Container>
      </section>

      <section aria-labelledby="faq-title" className="py-20 sm:py-28">
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          <div className="space-y-4">
            <h2 id="faq-title" className="headline">
              Preguntas que todos nos hacemos
            </h2>
            <p className="lead text-fg-muted">Si tienes dudas antes de empezar, es normal. Estas son las más frecuentes.</p>
          </div>
          <div className="divide-y divide-border border-y border-border">
            {faq.map((item) => (
              <details key={item.q} className="group py-1">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg font-semibold tracking-[-0.01em] [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span
                    aria-hidden="true"
                    className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xl leading-none transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="pb-5 text-fg-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </Container>
      </section>

      <section aria-labelledby="contribute-title" className="border-t border-border bg-band py-20 sm:py-28">
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-5">
            <h2 id="contribute-title" className="headline">
              Para quien quiere aprender, y para quien quiere enseñar.
            </h2>
            <ButtonLink to="/contribuir" size="lg">
              Cómo contribuir
            </ButtonLink>
          </div>
          <ul className="divide-y divide-border border-y border-border">
            {audience.map((a) => (
              <li key={a} className="py-4 text-lg tracking-[-0.01em]">
                {a}
              </li>
            ))}
          </ul>
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
    <section aria-labelledby="featured-title" className="py-20 sm:py-28">
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
