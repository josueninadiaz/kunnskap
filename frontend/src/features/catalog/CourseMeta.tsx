import { Clock, Construction, GraduationCap } from 'lucide-react'
import { type CourseLevel, type CourseStatus, formatDuration, levelLabels } from './catalogApi'

/** Distingue de forma visible y textual los cursos en preparación de los disponibles. */
export function CourseStatusBadge({ status }: { status: CourseStatus }) {
  if (status === 'Published') {
    return (
      <span className="inline-flex shrink-0 items-center rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-medium text-fg">
        Disponible
      </span>
    )
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-warning-soft px-2.5 py-0.5 text-xs font-medium text-fg">
      <Construction aria-hidden="true" className="size-3.5" />
      En preparación
    </span>
  )
}

interface CourseFactsProps {
  level: CourseLevel
  estimatedMinutes: number | null
  /** El curso está publicado pero aún tiene módulos sin lecciones: la duración es solo de lo publicado. */
  partial?: boolean
}

export function CourseFacts({ level, estimatedMinutes, partial = false }: CourseFactsProps) {
  const duration = formatDuration(estimatedMinutes)
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-fg-muted">
      <li className="inline-flex items-center gap-1.5">
        <GraduationCap aria-hidden="true" className="size-4" />
        <span className="sr-only">Nivel:</span> {levelLabels[level]}
      </li>
      {duration ? (
        <li className="inline-flex items-center gap-1.5">
          <Clock aria-hidden="true" className="size-4" />
          <span className="sr-only">Duración estimada:</span> {duration}
          {partial ? ' publicadas' : null}
        </li>
      ) : null}
      {partial ? <li>Más módulos en preparación</li> : null}
    </ul>
  )
}
