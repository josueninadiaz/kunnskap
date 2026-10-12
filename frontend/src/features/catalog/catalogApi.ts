import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { ApiError, apiGet } from '../../lib/api'

export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced'
export type CourseStatus = 'Published' | 'InDevelopment'

export interface Technology {
  slug: string
  name: string
}

export interface SchoolSummary {
  slug: string
  name: string
  description: string
  publishedCourses: number
  coursesInDevelopment: number
}

export interface CatalogFacets {
  schools: SchoolSummary[]
  technologies: Technology[]
  levels: CourseLevel[]
}

export interface CourseListItem {
  slug: string
  title: string
  summary: string
  school: { slug: string; name: string }
  level: CourseLevel
  status: CourseStatus
  estimatedMinutes: number | null
  technologies: Technology[]
  moduleCount: number
  /** Todos los módulos tienen lecciones publicadas. */
  contentComplete: boolean
}

export interface Paged<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
}

export interface CourseDetail {
  slug: string
  title: string
  summary: string
  descriptionMarkdown: string
  school: { slug: string; name: string }
  level: CourseLevel
  status: CourseStatus
  estimatedMinutes: number | null
  language: string
  licenseSpdx: string
  learningObjectives: string[]
  prerequisites: string[]
  authors: string[]
  softwareVersions: string[]
  lastReviewedAt: string | null
  technologies: Technology[]
  modules: { title: string; summary: string; lessons: { slug: string; title: string; estimatedMinutes: number }[] }[]
  contentComplete: boolean
}

export interface LessonLink {
  slug: string
  title: string
}

export interface LessonView {
  courseSlug: string
  courseTitle: string
  moduleNumber: number
  moduleTitle: string
  slug: string
  title: string
  estimatedMinutes: number
  bodyMarkdown: string
  practiceActivityMarkdown: string
  checkCriteriaMarkdown: string
  videoUrl: string | null
  transcriptMarkdown: string | null
  position: number
  totalLessons: number
  previous: LessonLink | null
  next: LessonLink | null
}

/** Filtros del catálogo. Viven en la URL (?q=…&escuela=…) para poder compartir y volver atrás. */
export interface CatalogFilters {
  q: string
  school: string
  level: string
  technology: string
  duration: string
  page: number
}

export const levelLabels: Record<CourseLevel, string> = {
  Beginner: 'Principiante',
  Intermediate: 'Intermedio',
  Advanced: 'Avanzado',
}

export const durationLabels: Record<string, string> = {
  corto: 'Hasta 10 horas',
  medio: 'De 10 a 30 horas',
  largo: 'Más de 30 horas',
}

export const PAGE_SIZE = 20

export function useCatalogFacets() {
  return useQuery({
    queryKey: ['catalog', 'facets'],
    queryFn: ({ signal }) => apiGet<CatalogFacets>('/catalog/facets', { signal }),
  })
}

export function toSearchParams(filters: CatalogFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.q.trim()) params.set('q', filters.q.trim())
  if (filters.school) params.set('school', filters.school)
  if (filters.level) params.set('level', filters.level)
  if (filters.technology) params.set('technology', filters.technology)
  if (filters.duration) params.set('duration', filters.duration)
  params.set('page', String(filters.page))
  params.set('pageSize', String(PAGE_SIZE))
  return params
}

export function useCourses(filters: CatalogFilters) {
  return useQuery({
    queryKey: ['catalog', 'courses', filters],
    queryFn: ({ signal }) => apiGet<Paged<CourseListItem>>(`/catalog/courses?${toSearchParams(filters).toString()}`, { signal }),
    // Mantiene los resultados anteriores mientras llegan los nuevos: la lista no "salta" al filtrar.
    placeholderData: keepPreviousData,
  })
}

export function useCourse(slug: string) {
  return useQuery({
    queryKey: ['catalog', 'course', slug],
    queryFn: async ({ signal }) => {
      try {
        return await apiGet<CourseDetail>(`/catalog/courses/${encodeURIComponent(slug)}`, { signal })
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null
        throw error
      }
    },
  })
}

export function useLesson(courseSlug: string, lessonSlug: string) {
  return useQuery({
    queryKey: ['catalog', 'lesson', courseSlug, lessonSlug],
    queryFn: async ({ signal }) => {
      try {
        return await apiGet<LessonView>(
          `/catalog/courses/${encodeURIComponent(courseSlug)}/lessons/${encodeURIComponent(lessonSlug)}`,
          { signal },
        )
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null
        throw error
      }
    },
  })
}

/** "≈ 12 h" o "≈ 45 min". Null si la duración aún no se ha estimado. */
export function formatDuration(minutes: number | null): string | null {
  if (minutes === null) return null
  if (minutes < 60) return `≈ ${minutes} min`
  const hours = Math.round(minutes / 60)
  return `≈ ${hours} h`
}
