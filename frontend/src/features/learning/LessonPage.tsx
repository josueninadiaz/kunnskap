import { CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Circle, Clock } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { Button, ButtonLink } from '../../components/ui/Button'
import { Markdown } from '../../components/ui/Markdown'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatusMessage } from '../../components/ui/StatusMessage'
import { describeError } from '../../lib/api'
import { useCurrentUser } from '../auth/authApi'
import { type CourseDetail, type LessonView, useCourse, useLesson } from '../catalog/catalogApi'
import { useCourseProgress, useRecordVisit, useSetLessonCompletion } from './learningApi'

export function LessonPage() {
  const { slug = '', lessonSlug = '' } = useParams()
  const lesson = useLesson(slug, lessonSlug)

  if (lesson.isPending) return <StatusMessage tone="loading" title="Cargando la lección…" />

  if (lesson.isError) {
    return (
      <StatusMessage
        tone="error"
        title="No se pudo cargar la lección"
        action={
          <Button variant="secondary" onClick={() => void lesson.refetch()}>
            Reintentar
          </Button>
        }
      >
        {describeError(lesson.error)}
      </StatusMessage>
    )
  }

  if (lesson.data === null) {
    return (
      <section>
        <PageHeader title="Lección no encontrada" description="Puede que la dirección sea incorrecta o que el curso aún no esté publicado." />
        <ButtonLink to={`/cursos/${slug}`}>Volver al curso</ButtonLink>
      </section>
    )
  }

  // La key reinicia el estado (p. ej. el registro de visita) al pasar a otra lección.
  return <LessonContent key={lesson.data.slug} lesson={lesson.data} />
}

function LessonContent({ lesson }: { lesson: LessonView }) {
  const user = useCurrentUser()
  const progress = useCourseProgress(lesson.courseSlug, Boolean(user.data))
  const enrolled = progress.data?.enrolled === true
  const recordVisit = useRecordVisit(lesson.courseSlug)
  const visited = useRef(false)

  // Guarda esta lección como punto desde el que continuar (una vez por lección).
  useEffect(() => {
    if (enrolled && !visited.current) {
      visited.current = true
      recordVisit.mutate(lesson.slug)
    }
  }, [enrolled, lesson.slug, recordVisit])

  const lessonUrl = (slug: string) => `/cursos/${lesson.courseSlug}/lecciones/${slug}`
  const course = useCourse(lesson.courseSlug)
  const completed = new Set(progress.data?.completedLessonSlugs ?? [])

  return (
    <div className="grid gap-10 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-16">
      {course.data ? <CourseOutline course={course.data} currentSlug={lesson.slug} completed={completed} /> : <div />}
    <article className="min-w-0 max-w-(--container-prose)">
      <nav aria-label="Ruta de navegación" className="mb-4 text-sm text-fg-muted">
        <ol className="flex flex-wrap gap-1">
          <li>
            <Link to="/cursos" className="underline hover:text-fg">
              Cursos
            </Link>
            <span aria-hidden="true"> / </span>
          </li>
          <li>
            <Link to={`/cursos/${lesson.courseSlug}`} className="underline hover:text-fg">
              {lesson.courseTitle}
            </Link>
          </li>
        </ol>
      </nav>

      <p className="mb-2 text-sm font-medium text-accent">
        Módulo {lesson.moduleNumber}. {lesson.moduleTitle}
      </p>
      <PageHeader title={lesson.title} />
      <p className="-mt-4 mb-8 flex flex-wrap gap-x-4 gap-y-1 text-sm text-fg-muted">
        <span>
          Lección {lesson.position} de {lesson.totalLessons}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock aria-hidden="true" className="size-4" />
          <span className="sr-only">Duración estimada:</span> {lesson.estimatedMinutes} min
        </span>
      </p>

      <div className="space-y-10 text-[1.0625rem] leading-[1.7]">
        {lesson.videoUrl ? (
          <section className="space-y-3 rounded-(--radius-panel) border border-border bg-surface p-4">
            <p>
              Esta lección tiene un{' '}
              <a href={lesson.videoUrl} className="font-medium text-accent underline" target="_blank" rel="noopener noreferrer">
                video opcional
              </a>
              . Todo su contenido está también en el texto.
            </p>
            {lesson.transcriptMarkdown ? (
              <details>
                <summary className="cursor-pointer font-medium">Transcripción del video</summary>
                <div className="mt-3">
                  <Markdown>{lesson.transcriptMarkdown}</Markdown>
                </div>
              </details>
            ) : null}
          </section>
        ) : null}

        <Markdown>{lesson.bodyMarkdown}</Markdown>

        <section aria-labelledby="actividad" className="space-y-3 rounded-(--radius-panel) border border-border bg-surface p-5">
          <h2 id="actividad" className="text-xl">
            Actividad práctica
          </h2>
          <Markdown>{lesson.practiceActivityMarkdown}</Markdown>
        </section>

        <section aria-labelledby="comprueba" className="space-y-3">
          <h2 id="comprueba" className="text-xl">
            Comprueba lo aprendido
          </h2>
          <Markdown>{lesson.checkCriteriaMarkdown}</Markdown>
        </section>

        <CompletionControl lesson={lesson} enrolled={enrolled} signedIn={Boolean(user.data)} />

        <nav aria-label="Lecciones" className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:justify-between">
          {lesson.previous ? (
            <Link to={lessonUrl(lesson.previous.slug)} className="group inline-flex items-start gap-2 text-sm">
              <ChevronLeft aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <span>
                <span className="block text-fg-muted">Anterior</span>
                <span className="font-medium text-accent group-hover:underline">{lesson.previous.title}</span>
              </span>
            </Link>
          ) : (
            <span />
          )}
          {lesson.next ? (
            <Link to={lessonUrl(lesson.next.slug)} className="group inline-flex items-start gap-2 text-sm sm:text-right">
              <span>
                <span className="block text-fg-muted">Siguiente</span>
                <span className="font-medium text-accent group-hover:underline">{lesson.next.title}</span>
              </span>
              <ChevronRight aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            </Link>
          ) : (
            <Link to={`/cursos/${lesson.courseSlug}`} className="text-sm font-medium text-accent underline">
              Volver al temario del curso
            </Link>
          )}
        </nav>
      </div>
    </article>
    </div>
  )
}

/** Índice del curso: fijo al lado en escritorio, desplegable en móvil. */
function CourseOutline({ course, currentSlug, completed }: { course: CourseDetail; currentSlug: string; completed: Set<string> }) {
  const modules = course.modules.filter((m) => m.lessons.length > 0)
  const total = modules.reduce((n, m) => n + m.lessons.length, 0)

  const list = (
    <ol className="space-y-6">
      {modules.map((m) => (
        <li key={m.title}>
          <p className="eyebrow text-fg-muted">{m.title}</p>
          <ol className="mt-2 space-y-0.5">
            {m.lessons.map((l) => {
              const current = l.slug === currentSlug
              const done = completed.has(l.slug)
              return (
                <li key={l.slug}>
                  <Link
                    to={`/cursos/${course.slug}/lecciones/${l.slug}`}
                    aria-current={current ? 'page' : undefined}
                    className={`flex items-start gap-2.5 rounded-(--radius-control) px-2.5 py-2 text-[0.9375rem] leading-snug ${
                      current ? 'bg-accent-soft font-medium text-accent-soft-fg' : 'text-fg hover:bg-surface-muted'
                    }`}
                  >
                    {done ? (
                      <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />
                    ) : (
                      <Circle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-fg-muted" />
                    )}
                    <span>
                      {l.title}
                      {done ? <span className="sr-only"> (completada)</span> : null}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ol>
        </li>
      ))}
    </ol>
  )

  return (
    <nav aria-label="Contenido del curso" className="lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:self-start lg:overflow-y-auto">
      <details className="group rounded-(--radius-panel) border border-border bg-surface lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-medium [&::-webkit-details-marker]:hidden">
          <span>
            Contenido del curso <span className="font-normal text-fg-muted">· {total} lecciones</span>
          </span>
          <ChevronDown aria-hidden="true" className="size-5 text-fg-muted transition-transform group-open:rotate-180" />
        </summary>
        <div className="border-t border-border px-2 py-4">{list}</div>
      </details>
      <div className="hidden lg:block">
        <Link to={`/cursos/${course.slug}`} className="mb-6 block font-semibold tracking-[-0.015em] hover:text-accent">
          {course.title}
        </Link>
        {list}
      </div>
    </nav>
  )
}

function CompletionControl({ lesson, enrolled, signedIn }: { lesson: LessonView; enrolled: boolean; signedIn: boolean }) {
  const location = useLocation()
  const progress = useCourseProgress(lesson.courseSlug, signedIn)
  const setCompletion = useSetLessonCompletion(lesson.courseSlug)

  if (!signedIn) {
    return (
      <p className="text-sm text-fg-muted">
        <Link to={`/entrar?volver=${encodeURIComponent(location.pathname)}`} className="font-medium text-accent underline">
          Entra
        </Link>{' '}
        o{' '}
        <Link to="/registro" className="font-medium text-accent underline">
          crea una cuenta gratuita
        </Link>{' '}
        para guardar tu progreso.
      </p>
    )
  }

  if (!enrolled) {
    return (
      <p className="text-sm text-fg-muted">
        <Link to={`/cursos/${lesson.courseSlug}`} className="font-medium text-accent underline">
          Inscríbete en el curso
        </Link>{' '}
        para marcar lecciones como completadas.
      </p>
    )
  }

  const done = progress.data?.completedLessonSlugs.includes(lesson.slug) ?? false

  return (
    <div className="space-y-3">
      {setCompletion.isError ? (
        <StatusMessage tone="error" title="No se pudo guardar">
          {describeError(setCompletion.error)}
        </StatusMessage>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant={done ? 'secondary' : 'primary'}
          aria-pressed={done}
          disabled={setCompletion.isPending}
          onClick={() => setCompletion.mutate({ lessonSlug: lesson.slug, completed: !done })}
        >
          {done ? <CheckCircle2 aria-hidden="true" className="size-4 text-success" /> : null}
          {done ? 'Completada' : 'Marcar como completada'}
        </Button>
        {done ? <span className="text-sm text-fg-muted">Pulsa de nuevo si quieres desmarcarla.</span> : null}
      </div>
    </div>
  )
}
