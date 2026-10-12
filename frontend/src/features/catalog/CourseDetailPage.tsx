import { Link, useParams } from 'react-router'
import { Button, ButtonLink } from '../../components/ui/Button'
import { Markdown } from '../../components/ui/Markdown'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatusMessage } from '../../components/ui/StatusMessage'
import { CheckCircle2 } from 'lucide-react'
import { describeError } from '../../lib/api'
import { useCurrentUser } from '../auth/authApi'
import { EnrollmentPanel } from '../learning/EnrollmentPanel'
import { useCourseProgress } from '../learning/learningApi'
import { type CourseDetail, useCourse } from './catalogApi'
import { CourseFacts, CourseStatusBadge } from './CourseMeta'

const dateFormat = new Intl.DateTimeFormat('es', { dateStyle: 'long', timeZone: 'UTC' })

export function CourseDetailPage() {
  const { slug = '' } = useParams()
  const course = useCourse(slug)

  if (course.isPending) return <StatusMessage tone="loading" title="Cargando el curso…" />

  if (course.isError) {
    return (
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
    )
  }

  if (course.data === null) {
    return (
      <section>
        <PageHeader title="Curso no encontrado" description="Puede que la dirección sea incorrecta o que el curso ya no esté disponible." />
        <ButtonLink to="/cursos">Ver todos los cursos</ButtonLink>
      </section>
    )
  }

  return <CourseView course={course.data} />
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl">{title}</h2>
      {children}
    </section>
  )
}

function CourseView({ course }: { course: CourseDetail }) {
  const user = useCurrentUser()
  const published = course.status === 'Published'
  const progress = useCourseProgress(course.slug, published && Boolean(user.data))
  const completed = new Set(progress.data?.completedLessonSlugs ?? [])
  const lessonSlugs = course.modules.flatMap((m) => m.lessons.map((l) => l.slug))

  return (
    <article className="max-w-3xl">
      <nav aria-label="Ruta de navegación" className="mb-4 text-sm text-fg-muted">
        <ol className="flex flex-wrap gap-1">
          <li>
            <Link to="/cursos" className="underline hover:text-fg">
              Cursos
            </Link>
            <span aria-hidden="true"> / </span>
          </li>
          <li>
            <Link to={`/cursos?escuela=${course.school.slug}`} className="underline hover:text-fg">
              {course.school.name}
            </Link>
          </li>
        </ol>
      </nav>

      <div className="mb-2">
        <CourseStatusBadge status={course.status} />
      </div>
      <PageHeader title={course.title} description={course.summary} />

      <div className="space-y-10">
        <CourseFacts level={course.level} estimatedMinutes={course.estimatedMinutes} partial={published && !course.contentComplete} />

        {published ? <EnrollmentPanel courseSlug={course.slug} lessonSlugs={lessonSlugs} /> : null}

        {course.status === 'InDevelopment' ? (
          <StatusMessage tone="info" title="Este curso está en preparación">
            Todavía no admite inscripciones. Aquí puedes ver lo que aprenderás y el temario previsto.
          </StatusMessage>
        ) : null}

        <Markdown>{course.descriptionMarkdown}</Markdown>

        {course.learningObjectives.length > 0 ? (
          <Section title="Qué aprenderás">
            <ul className="list-disc space-y-2 pl-5 marker:text-accent">
              {course.learningObjectives.map((o) => (
                <li key={o}>
                  <Markdown>{o}</Markdown>
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        {course.prerequisites.length > 0 ? (
          <Section title="Requisitos previos">
            <ul className="list-disc space-y-2 pl-5 marker:text-accent">
              {course.prerequisites.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </Section>
        ) : null}

        {course.modules.length > 0 ? (
          <Section title={course.status === 'InDevelopment' ? 'Temario previsto' : 'Temario'}>
            <ol className="space-y-4">
              {course.modules.map((m, index) => (
                <li key={m.title} className="border-l-2 border-border pl-4">
                  <h3 className="font-semibold">
                    Módulo {index + 1}. {m.title}
                  </h3>
                  {published && m.lessons.length === 0 ? (
                    <p className="text-sm text-fg-muted">En preparación</p>
                  ) : null}
                  {m.summary ? (
                    <div className="mt-1 text-fg-muted">
                      <Markdown>{m.summary}</Markdown>
                    </div>
                  ) : null}
                  {m.lessons.length > 0 ? (
                    <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
                      {m.lessons.map((l) => (
                        <li key={l.slug}>
                          <Link to={`/cursos/${course.slug}/lecciones/${l.slug}`} className="text-accent underline">
                            {l.title}
                          </Link>{' '}
                          <span className="text-fg-muted">({l.estimatedMinutes} min)</span>
                          {completed.has(l.slug) ? (
                            <span className="ml-2 inline-flex items-center gap-1 text-success">
                              <CheckCircle2 aria-hidden="true" className="size-4" />
                              <span className="sr-only">Completada</span>
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ol>
                  ) : null}
                </li>
              ))}
            </ol>
          </Section>
        ) : null}

        <Section title="Detalles">
          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[max-content_1fr]">
            {course.technologies.length > 0 ? (
              <>
                <dt className="font-medium">Tecnologías</dt>
                <dd>{course.technologies.map((t) => t.name).join(', ')}</dd>
              </>
            ) : null}
            {course.softwareVersions.length > 0 ? (
              <>
                <dt className="font-medium">Versiones</dt>
                <dd>{course.softwareVersions.join(', ')}</dd>
              </>
            ) : null}
            {course.authors.length > 0 ? (
              <>
                <dt className="font-medium">Autoría</dt>
                <dd>{course.authors.join(', ')}</dd>
              </>
            ) : null}
            <dt className="font-medium">Licencia del contenido</dt>
            <dd>{course.licenseSpdx === 'CC-BY-SA-4.0' ? 'CC BY-SA 4.0' : course.licenseSpdx}</dd>
            {course.lastReviewedAt ? (
              <>
                <dt className="font-medium">Última revisión</dt>
                <dd>{dateFormat.format(new Date(course.lastReviewedAt))}</dd>
              </>
            ) : null}
          </dl>
        </Section>
      </div>
    </article>
  )
}
