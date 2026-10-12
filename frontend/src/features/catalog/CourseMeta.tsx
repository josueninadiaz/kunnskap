import { Clock, Construction, GraduationCap } from 'lucide-react'
import { type CourseLevel, type CourseStatus, formatDuration, levelLabels } from './catalogApi'

/** Distingue de forma visible y textual los cursos en preparación de los disponibles. */
export function CourseStatusBadge({ status }: { status: CourseStatus }) {
  if (status === 'Published') {
    return (
      <span className="inline-flex items-center rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-medium text-fg">
        Disponible
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-warning-soft px-2.5 py-0.5 text-xs font-medium text-fg">
      <Construction aria-hidden="true" className="size-3.5" />
      En preparación
    </span>
  )
}

export function CourseFacts({ level, estimatedMinutes }: { level: CourseLevel; estimatedMinutes: number | null }) {
  const duration = formatDuration(estimatedMinutes)
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-fg-muted">
      <li className="inline-flex items-center gap-1.5">
        <GraduationCap aria-hidden="true" className="size-4" />
        <span className="sr-only">Nivel:</span> {levelLabels[level]}
      </li>
      {duration ? (
        <li className="inline-flex items-center gap-1.5">
          <Clock aria-hidden="true" className="size-4" />
          <span className="sr-only">Duración estimada:</span> {duration}
        </li>
      ) : null}
    </ul>
  )
}
