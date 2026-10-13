import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { apiCalls, jsonResponse, mockApi, renderRoute } from '../../test/render'
import type { CourseDetail, LessonView } from '../catalog/catalogApi'
import { type CourseProgress, continueLesson } from './learningApi'

const ana = { id: '1', email: 'ana@example.org', displayName: 'Ana', roles: ['Student'], permissions: [] }

const course: CourseDetail = {
  slug: 'csharp',
  title: 'Programar desde cero con C#',
  summary: 'Resumen',
  descriptionMarkdown: 'Descripción',
  school: { slug: 'fundamentos', name: 'Fundamentos' },
  level: 'Beginner',
  status: 'Published',
  estimatedMinutes: 60,
  language: 'es',
  licenseSpdx: 'CC-BY-SA-4.0',
  learningObjectives: [],
  prerequisites: [],
  authors: [],
  softwareVersions: [],
  lastReviewedAt: '2026-10-12T00:00:00Z',
  technologies: [],
  modules: [
    {
      title: 'Tu primer programa',
      summary: '',
      lessons: [
        { slug: 'que-es-programar', title: '¿Qué es programar?', estimatedMinutes: 15 },
        { slug: 'tu-primer-programa', title: 'Tu primer programa', estimatedMinutes: 20 },
      ],
      quiz: null,
    },
    { title: 'Datos y operaciones', summary: '', lessons: [], quiz: null },
  ],
  contentComplete: false,
}

const lesson: LessonView = {
  courseSlug: 'csharp',
  courseTitle: 'Programar desde cero con C#',
  moduleNumber: 1,
  moduleTitle: 'Tu primer programa',
  slug: 'tu-primer-programa',
  title: 'Tu primer programa',
  estimatedMinutes: 20,
  bodyMarkdown: 'Escribe:\n\n```csharp\nConsole.WriteLine("¡Hola, mundo!");\n```',
  practiceActivityMarkdown: 'Crea `hola.cs`.',
  checkCriteriaMarkdown: '- Se ejecuta sin errores.',
  videoUrl: null,
  transcriptMarkdown: null,
  position: 2,
  totalLessons: 2,
  previous: { slug: 'que-es-programar', title: '¿Qué es programar?' },
  next: null,
}

const progress = (overrides: Partial<CourseProgress> = {}): CourseProgress => ({
  enrolled: true,
  enrolledAt: '2026-10-12T00:00:00Z',
  completedAt: null,
  lastLessonSlug: null,
  completedLessonSlugs: [],
  totalLessons: 2,
  passedQuizSlugs: [],
  totalQuizzes: 0,
  ...overrides,
})

const signedIn = { 'GET /api/auth/me': () => jsonResponse(ana) }
const courseApi = { 'GET /api/catalog/courses/csharp': () => jsonResponse(course) }
const lessonApi = { 'GET /api/catalog/courses/csharp/lessons/tu-primer-programa': () => jsonResponse(lesson) }

describe('detalle de un curso publicado', () => {
  it('permite empezar sin cuenta y ofrece entrar para guardar el progreso', async () => {
    mockApi(courseApi)

    renderRoute('/cursos/csharp')

    expect(await screen.findByRole('link', { name: 'Empezar el curso' })).toHaveAttribute(
      'href',
      '/cursos/csharp/lecciones/que-es-programar',
    )
    expect(screen.getByRole('link', { name: 'Entrar para guardar mi progreso' })).toHaveAttribute(
      'href',
      '/entrar?volver=%2Fcursos%2Fcsharp',
    )
    expect(screen.getByText('Más módulos en preparación')).toBeInTheDocument()
    expect(screen.getByText('En preparación')).toBeInTheDocument()
  })

  it('inscribe gratis con el token antiforgery y muestra el progreso', async () => {
    let token: string | null = null
    const fetchMock = mockApi({
      ...signedIn,
      ...courseApi,
      'GET /api/learning/courses/csharp/progress': () => jsonResponse(progress({ enrolled: false, enrolledAt: null })),
      'POST /api/learning/courses/csharp/enrollment': (init) => {
        token = new Headers(init?.headers).get('X-XSRF-TOKEN')
        return jsonResponse(progress())
      },
    })

    renderRoute('/cursos/csharp')
    await userEvent.click(await screen.findByRole('button', { name: 'Inscribirme gratis' }))

    expect(await screen.findByText('0 de 2 lecciones completadas')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Empezar el curso' })).toBeInTheDocument()
    expect(token).toBe('token-de-prueba')
    expect(apiCalls(fetchMock)).toContain('POST /api/learning/courses/csharp/enrollment')
  })

  it('continúa desde la última lección y marca las completadas en el temario', async () => {
    mockApi({
      ...signedIn,
      ...courseApi,
      'GET /api/learning/courses/csharp/progress': () =>
        jsonResponse(progress({ completedLessonSlugs: ['que-es-programar'], lastLessonSlug: 'que-es-programar' })),
    })

    renderRoute('/cursos/csharp')

    expect(await screen.findByRole('link', { name: 'Continuar' })).toHaveAttribute(
      'href',
      '/cursos/csharp/lecciones/tu-primer-programa',
    )
    const firstLesson = screen.getByRole('link', { name: '¿Qué es programar?' }).closest('li')!
    expect(within(firstLesson).getByText('Completada')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: '1 de 2 lecciones completadas' })).toBeInTheDocument()
  })
})

describe('lección', () => {
  it('se puede leer sin cuenta: explicación, actividad, criterios y navegación', async () => {
    const fetchMock = mockApi(lessonApi)

    renderRoute('/cursos/csharp/lecciones/tu-primer-programa')

    expect(await screen.findByRole('heading', { level: 1, name: 'Tu primer programa' })).toBeInTheDocument()
    expect(screen.getByText('Lección 2 de 2')).toBeInTheDocument()
    expect(screen.getByText('Console.WriteLine("¡Hola, mundo!");').closest('pre')).not.toBeNull()
    expect(screen.getByRole('heading', { name: 'Actividad práctica' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Comprueba lo aprendido' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Anterior/ })).toHaveAttribute('href', '/cursos/csharp/lecciones/que-es-programar')
    expect(screen.getByRole('link', { name: 'Volver al temario del curso' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'crea una cuenta gratuita' })).toBeInTheDocument()
    expect(apiCalls(fetchMock).some((c) => c.includes('/visit'))).toBe(false)
  })

  it('registra la visita y permite marcarla como completada', async () => {
    let completed = false
    const fetchMock = mockApi({
      ...signedIn,
      ...lessonApi,
      'GET /api/learning/courses/csharp/progress': () => jsonResponse(progress()),
      'PUT /api/learning/courses/csharp/lessons/tu-primer-programa/visit': () => jsonResponse(null, 204),
      'PUT /api/learning/courses/csharp/lessons/tu-primer-programa/completion': () => {
        completed = true
        return jsonResponse(progress({ completedLessonSlugs: ['tu-primer-programa'] }))
      },
    })

    renderRoute('/cursos/csharp/lecciones/tu-primer-programa')
    const button = await screen.findByRole('button', { name: 'Marcar como completada' })
    expect(button).toHaveAttribute('aria-pressed', 'false')

    await userEvent.click(button)

    expect(await screen.findByRole('button', { name: 'Completada' })).toHaveAttribute('aria-pressed', 'true')
    expect(completed).toBe(true)
    expect(apiCalls(fetchMock).filter((c) => c.endsWith('/visit'))).toHaveLength(1)
  })

  it('muestra «Lección no encontrada» si el curso no está publicado', async () => {
    mockApi({ 'GET /api/catalog/courses/csharp/lessons/borrador': () => jsonResponse({ status: 404 }, 404) })

    renderRoute('/cursos/csharp/lecciones/borrador')

    expect(await screen.findByRole('heading', { level: 1, name: 'Lección no encontrada' })).toBeInTheDocument()
  })
})

describe('continueLesson', () => {
  const slugs = ['a', 'b', 'c']

  it.each([
    [{}, 'a'],
    [{ lastLessonSlug: 'b' }, 'b'],
    [{ lastLessonSlug: 'b', completedLessonSlugs: ['a', 'b'] }, 'c'],
    [{ completedLessonSlugs: ['a', 'b', 'c'] }, 'a'],
    [{ lastLessonSlug: 'eliminada' }, 'a'],
  ])('%o → %s', (overrides, expected) => {
    expect(continueLesson(slugs, progress(overrides))).toBe(expected)
  })
})
