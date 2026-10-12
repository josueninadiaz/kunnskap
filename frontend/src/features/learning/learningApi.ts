import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiSend } from '../../lib/api'

export interface CourseProgress {
  enrolled: boolean
  enrolledAt: string | null
  completedAt: string | null
  lastLessonSlug: string | null
  completedLessonSlugs: string[]
  totalLessons: number
}

const progressKey = (courseSlug: string) => ['learning', 'progress', courseSlug] as const
const base = (courseSlug: string) => `/learning/courses/${encodeURIComponent(courseSlug)}`

/** Progreso en un curso. Solo se consulta con sesión iniciada (enabled). */
export function useCourseProgress(courseSlug: string, enabled: boolean) {
  return useQuery({
    queryKey: progressKey(courseSlug),
    queryFn: ({ signal }) => apiGet<CourseProgress>(`${base(courseSlug)}/progress`, { signal }),
    enabled,
  })
}

export function useEnroll(courseSlug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiSend<CourseProgress>('POST', `${base(courseSlug)}/enrollment`),
    onSuccess: (progress) => queryClient.setQueryData(progressKey(courseSlug), progress),
  })
}

export function useRecordVisit(courseSlug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (lessonSlug: string) =>
      apiSend<void>('PUT', `${base(courseSlug)}/lessons/${encodeURIComponent(lessonSlug)}/visit`),
    onSuccess: (_, lessonSlug) =>
      queryClient.setQueryData<CourseProgress>(progressKey(courseSlug), (p) => (p ? { ...p, lastLessonSlug: lessonSlug } : p)),
  })
}

export function useSetLessonCompletion(courseSlug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ lessonSlug, completed }: { lessonSlug: string; completed: boolean }) =>
      apiSend<CourseProgress>(
        completed ? 'PUT' : 'DELETE',
        `${base(courseSlug)}/lessons/${encodeURIComponent(lessonSlug)}/completion`,
      ),
    onSuccess: (progress) => queryClient.setQueryData(progressKey(courseSlug), progress),
  })
}

/**
 * Lección desde la que continuar: la última visitada si no está completada; si no, la primera
 * sin completar; si todas lo están, la primera.
 */
export function continueLesson(lessonSlugs: string[], progress: CourseProgress): string | undefined {
  const done = new Set(progress.completedLessonSlugs)
  if (progress.lastLessonSlug && lessonSlugs.includes(progress.lastLessonSlug) && !done.has(progress.lastLessonSlug)) {
    return progress.lastLessonSlug
  }
  return lessonSlugs.find((slug) => !done.has(slug)) ?? lessonSlugs[0]
}
