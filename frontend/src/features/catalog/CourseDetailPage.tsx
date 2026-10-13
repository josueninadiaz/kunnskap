import { Check, CheckCircle2, ChevronDown, Construction } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { Button, ButtonLink } from '../../components/ui/Button'
import { Markdown } from '../../components/ui/Markdown'
import { Container, Page } from '../../components/ui/Container'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatusMessage } from '../../components/ui/StatusMessage'
import { describeError } from '../../lib/api'
import { config } from '../../lib/config'
import { useCurrentUser } from '../auth/authApi'
import { EnrollmentPanel } from '../learning/EnrollmentPanel'
import { useCourseProgress } from '../learning/learningApi'
import { type CourseDetail, useCourse } from './catalogApi'
import { CourseFacts, CourseStatusBadge } from './CourseMeta'

const dateFormat = new Intl.DateTimeFormat('es', { dateStyle: 'long', timeZone: 'UTC' })

export function CourseDetailPage() {
  const { slug = '' } = useParams()
  const course = useCourse(slug)

  if (course.isPending) {
    return (
      <Page>
        <StatusMessage tone="loading" title="Cargando el curso…" />
      </Page>
    )
  }

  if (course.isError) {
    return (
      <Page>
        <StatusMessage
          tone="error"
          title="No se pudo cargar el curso"
          action={
            <Button variant="secondary" onClick={() => void course.refetch()}>
              Reintentar
            </Button>
          }
        >
          {describeError(course.error)}
        </StatusMessage>
      </Page>
    )
  }

  if (course.data === null) {
    return (
      <Page>
        <PageHeader title="Curso no encontrado" description="Puede que la dirección sea incorrecta o que el curso ya no esté disponible." />
        <ButtonLink to="/cursos">Ver todos los cursos</ButtonLink>
      </Page>
    )
  }

  return <CourseView course={course.data} />
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-5">
      <h2 className="text-[1.75rem] font-semibold tracking-[-0.025em]">{title}</h2>
      {children}
    </section>
  )
}

function CourseView({ course }: { course: CourseDetail }) {
  const user = useCurrentUser()
  const published = course.status === 'Published'
  const progress = useCourseProgress(course.slug, published && Boolean(user.data))
  const completed = new Set(progress.data?.completedLessonSlugs ?? [])
  const passedQuizzes = new Set(progress.data?.passedQuizSlugs ?? [])
  const lessonSlugs = course.modules.flatMap((m) => m.lessons.map((l) => l.slug))
  const lessonCount = lessonSlugs.length
  const author = course.authors[0]

  return (
    <article>
      <header className="border-b border-border bg-band">
        <Container className="py-12 sm:py-16 lg:py-20">
          <div className="max-w-3xl space-y-6">
            <nav aria-label="Ruta de navegación" className="text-sm text-fg-muted">
              <ol className="flex flex-wrap gap-1">
                <li>
                  <Link to="/cursos" className="hover:text-fg hover:underline">
                    Cursos
                  </Link>
                  <span aria-hidden="true"> / </span>
                </li>
                <li>
                  <Link to={`/cursos?escuela=${course.school.slug}`} className="hover:text-fg hover:underline">
                    {course.school.name}
                  </Link>
                </li>
              </ol>
            </nav>
            <CourseStatusBadge status={course.status} />
            <PageTitle title={course.title} />
            <p className="lead text-fg-muted">{course.summary}</p>
            <CourseFacts
              level={course.level}
              estimatedMinutes={course.estimatedMinutes}
              partial={published && !course.contentComplete}
            />
            {author ? (
              <div className="flex items-center gap-3 border-t border-border pt-6">
                <span
                  aria-hidden="true"
                  className="inline-flex size-11 items-center justify-center rounded-full bg-stage text-lg font-semibold text-stage-accent"
                >
                  {author.charAt(0)}
                </span>
                <span>
                  <span className="block text-sm text-fg-muted">Curso creado por</span>
                  <span className="font-semibold">{course.authors.join(', ')}</span>
                </span>
              </div>
            ) : null}
          </div>
        </Container>
      </header>

      <Container className="grid gap-12 py-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
        <aside className="space-y-6 lg:sticky lg:top-24 lg:order-2 lg:self-start" aria-label="Acceso al curso">
          {published ? (
            <EnrollmentPanel courseSlug={course.slug} lessonSlugs={lessonSlugs} />
          ) : (
            <div className="space-y-3 rounded-(--radius-panel) border border-border bg-surface p-6 shadow-soft">
              <p className="flex items-center gap-2 font-semibold">
                <Construction aria-hidden="true" className="size-5 text-warning" />
                Este curso está en preparación
              </p>
              <p className="text-[0.9375rem] text-fg-muted">
                Todavía no admite inscripciones. Aquí puedes ver lo que aprenderás y el temario previsto.
              </p>
            </div>
          )}

          <dl className="space-y-4 rounded-(--radius-panel) border border-border bg-surface p-6 text-[0.9375rem]">
            {lessonCount > 0 ? <Detail term="Lecciones publicadas">{lessonCount}</Detail> : null}
            <Detail term="Módulos">{course.modules.length}</Detail>
            {course.technologies.length > 0 ? (
              <Detail term="Tecnologías">{course.technologies.map((t) => t.name).join(', ')}</Detail>
            ) : null}
            {course.softwareVersions.length > 0 ? <Detail term="Versiones">{course.softwareVersions.join(', ')}</Detail> : null}
            <Detail term="Idioma">{course.language === 'es' ? 'Español' : course.language}</Detail>
            <Detail term="Licencia del contenido">
              {course.licenseSpdx === 'CC-BY-SA-4.0' ? 'CC BY-SA 4.0' : course.licenseSpdx}
            </Detail>
            {course.lastReviewedAt ? (
              <Detail term="Última revisión">{dateFormat.format(new Date(course.lastReviewedAt))}</Detail>
            ) : null}
            <Detail term="Precio">Gratis</Detail>
          </dl>
        </aside>

        <div className="min-w-0 space-y-14 lg:order-1">
          {course.learningObjectives.length > 0 ? (
            <section className="space-y-5 rounded-(--radius-panel) border border-border bg-surface p-6 sm:p-8">
              <h2 className="text-[1.75rem] font-semibold tracking-[-0.025em]">Qué aprenderás</h2>
              <ul className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                {course.learningObjectives.map((o) => (
                  <li key={o} className="flex gap-3">
                    <Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-accent" />
                    <div className="min-w-0 text-[0.9375rem]">
                      <Markdown>{o}</Markdown>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <div className="max-w-(--container-prose) text-lg">
            <Markdown>{course.descriptionMarkdown}</Markdown>
          </div>

          {course.modules.length > 0 ? (
            <Section title={published ? 'Temario' : 'Temario previsto'}>
              <ol className="divide-y divide-border overflow-hidden rounded-(--radius-panel) border border-border bg-surface">
                {course.modules.map((m, index) => (
                  <li key={m.title}>
                    <details className="group" open={index === 0}>
                      <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-4 hover:bg-surface-muted [&::-webkit-details-marker]:hidden">
                        <span className="w-5 shrink-0 text-right text-fg-muted tabular-nums">{index + 1}</span>
                        <span className="min-w-0 flex-1">
                          <h3 className="font-semibold">
                            Módulo {index + 1}. {m.title}
                          </h3>
                          <span className="text-sm text-fg-muted">
                            {m.lessons.length > 0
                              ? `${m.lessons.length} ${m.lessons.length === 1 ? 'lección' : 'lecciones'}`
                              : published
                                ? 'En preparación'
                                : 'Contenido previsto'}
                          </span>
                        </span>
                        <ChevronDown aria-hidden="true" className="size-5 shrink-0 text-fg-muted transition-transform group-open:rotate-180" />
                      </summary>
                      <div className="space-y-4 px-5 pb-5 pl-15">
                        {m.summary ? (
                          <div className="text-[0.9375rem] text-fg-muted">
                            <Markdown>{m.summary}</Markdown>
                          </div>
                        ) : null}
                        {m.lessons.length > 0 ? (
                          <ol className="space-y-2">
                            {m.lessons.map((l) => (
                              <li key={l.slug} className="flex items-baseline justify-between gap-4 text-[0.9375rem]">
                                <span className="flex items-baseline gap-2">
                                  {completed.has(l.slug) ? (
                                    <span className="inline-flex translate-y-0.5 text-success">
                                      <CheckCircle2 aria-hidden="true" className="size-4" />
                                      <span className="sr-only">Completada</span>
                                    </span>
                                  ) : null}
                                  <Link to={`/cursos/${course.slug}/lecciones/${l.slug}`} className="text-accent hover:underline">
                                    {l.title}
                                  </Link>
                                </span>
                                <span className="shrink-0 text-sm text-fg-muted tabular-nums">{l.estimatedMinutes} min</span>
                              </li>
                            ))}
                          </ol>
                        ) : null}
                        {m.quiz && published ? (
                          <p className="flex items-baseline justify-between gap-4 border-t border-border pt-3 text-[0.9375rem]">
                            <span className="flex items-baseline gap-2">
                              {passedQuizzes.has(m.quiz.slug) ? (
                                <span className="inline-flex translate-y-0.5 text-success">
                                  <CheckCircle2 aria-hidden="true" className="size-4" />
                                  <span className="sr-only">Aprobado</span>
                                </span>
                              ) : null}
                              <Link to={`/cursos/${course.slug}/cuestionarios/${m.quiz.slug}`} className="font-medium text-accent hover:underline">
                                Cuestionario: {m.quiz.title}
                              </Link>
                            </span>
                            <span className="shrink-0 text-sm text-fg-muted tabular-nums">{m.quiz.questionCount} preguntas</span>
                          </p>
                        ) : null}
                      </div>
                    </details>
                  </li>
                ))}
              </ol>
            </Section>
          ) : null}

          {course.prerequisites.length > 0 ? (
            <Section title="Requisitos previos">
              <ul className="max-w-(--container-prose) space-y-3">
                {course.prerequisites.map((p) => (
                  <li key={p} className="flex gap-3">
                    <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-accent" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}
        </div>
      </Container>
    </article>
  )
}

/** h1 del curso con el tamaño de escaparate; también actualiza el título del documento. */
function PageTitle({ title }: { title: string }) {
  return (
    <>
      <title>{`${title} · ${config.platformName}`}</title>
      <h1 className="display text-[clamp(2.25rem,1.6rem+3vw,4rem)]">{title}</h1>
    </>
  )
}

function Detail({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-fg-muted">{term}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  )
}
