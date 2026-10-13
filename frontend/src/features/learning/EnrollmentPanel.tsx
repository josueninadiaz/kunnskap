import { CheckCircle2 } from 'lucide-react'
import { useLocation } from 'react-router'
import { Button, ButtonLink } from '../../components/ui/Button'
import { StatusMessage } from '../../components/ui/StatusMessage'
import { describeError } from '../../lib/api'
import { useCurrentUser } from '../auth/authApi'
import { continueLesson, useCourseProgress, useEnroll } from './learningApi'

interface EnrollmentPanelProps {
  courseSlug: string
  lessonSlugs: string[]
}

const lessonPath = (courseSlug: string, lessonSlug: string) => `/cursos/${courseSlug}/lecciones/${lessonSlug}`

/** Acceso al curso: empezar a leer, inscribirse para guardar el progreso o continuar. */
export function EnrollmentPanel({ courseSlug, lessonSlugs }: EnrollmentPanelProps) {
  const location = useLocation()
  const user = useCurrentUser()
  const progress = useCourseProgress(courseSlug, Boolean(user.data))
  const enroll = useEnroll(courseSlug)
  const firstLesson = lessonSlugs[0]

  if (!firstLesson || user.isPending || (user.data && progress.isPending)) {
    return <div className="min-h-24" aria-hidden="true" />
  }

  const panel = 'space-y-5 rounded-(--radius-panel) border border-border bg-surface p-6 shadow-soft'

  if (!user.data) {
    return (
      <div className={panel}>
        <p className="text-2xl font-semibold tracking-[-0.025em]">Gratis</p>
        <p className="text-[0.9375rem] text-fg-muted">
          Puedes leer todas las lecciones sin cuenta. Si creas una cuenta gratuita, guardaremos tu progreso y podrás
          continuar donde lo dejaste.
        </p>
        <div className="grid gap-3">
          <ButtonLink to={lessonPath(courseSlug, firstLesson)} size="lg">
            Empezar el curso
          </ButtonLink>
          <ButtonLink to={`/entrar?volver=${encodeURIComponent(location.pathname)}`} variant="secondary">
            Entrar para guardar mi progreso
          </ButtonLink>
        </div>
      </div>
    )
  }

  if (progress.isError) {
    return (
      <StatusMessage tone="error" title="No se pudo cargar tu progreso">
        {describeError(progress.error)}
      </StatusMessage>
    )
  }

  const data = progress.data
  if (!data?.enrolled) {
    return (
      <div className={panel}>
        <p className="text-2xl font-semibold tracking-[-0.025em]">Gratis</p>
        <p className="text-[0.9375rem] text-fg-muted">
          Inscríbete para guardar tu progreso y continuar desde cualquier dispositivo.
        </p>
        {enroll.isError ? (
          <StatusMessage tone="error" title="No se pudo completar la inscripción">
            {describeError(enroll.error)}
          </StatusMessage>
        ) : null}
        <div className="grid gap-3">
          <Button size="lg" onClick={() => enroll.mutate()} disabled={enroll.isPending}>
            {enroll.isPending ? 'Inscribiendo…' : 'Inscribirme gratis'}
          </Button>
          <ButtonLink to={lessonPath(courseSlug, firstLesson)} variant="secondary">
            Leer sin inscribirme
          </ButtonLink>
        </div>
      </div>
    )
  }

  const completed = data.completedLessonSlugs.length
  const target = continueLesson(lessonSlugs, data) ?? firstLesson

  return (
    <div className={panel}>
      {data.completedAt ? (
        <p className="flex items-center gap-2 font-medium">
          <CheckCircle2 aria-hidden="true" className="size-5 text-success" />
          Completaste el curso: todas las lecciones y cuestionarios publicados.
        </p>
      ) : null}
      <div className="space-y-2">
        <label htmlFor="progreso-curso" className="block text-sm font-medium">
          {completed} de {data.totalLessons} lecciones completadas
        </label>
        {data.totalQuizzes > 0 ? (
          <p className="text-sm text-fg-muted">
            {data.passedQuizSlugs.length} de {data.totalQuizzes} {data.totalQuizzes === 1 ? 'cuestionario aprobado' : 'cuestionarios aprobados'}
          </p>
        ) : null}
        <progress
          id="progreso-curso"
          max={data.totalLessons}
          value={completed}
          className="h-2 w-full overflow-hidden rounded-full [&::-moz-progress-bar]:bg-accent [&::-webkit-progress-bar]:bg-surface-muted [&::-webkit-progress-value]:bg-accent"
        />
      </div>
      <ButtonLink to={lessonPath(courseSlug, target)} size="lg" className="w-full">
        {completed === 0 ? 'Empezar el curso' : 'Continuar'}
      </ButtonLink>
    </div>
  )
}
