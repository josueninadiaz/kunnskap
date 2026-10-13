import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { jsonResponse, mockApi, renderRoute } from '../../test/render'
import type { AttemptResult, QuizView } from './quizApi'

const quiz: QuizView = {
  courseSlug: 'csharp',
  courseTitle: 'Programar desde cero con C#',
  moduleNumber: 1,
  moduleTitle: 'Tu primer programa',
  slug: 'q1',
  title: 'Comprueba el módulo 1',
  passingScorePercent: 70,
  questions: [
    { id: 'p1', type: 'SingleChoice', promptMarkdown: '¿Qué instalas?', points: 1, options: [{ id: 'sdk', textMarkdown: 'El SDK' }, { id: 'runtime', textMarkdown: 'El Runtime' }] },
    { id: 'p2', type: 'ShortAnswer', promptMarkdown: 'Escribe el comando', points: 1, options: [] },
  ],
}

const ana = { id: '1', email: 'ana@example.org', displayName: 'Ana', roles: ['Student'], permissions: [] }
const enrolled = { enrolled: true, enrolledAt: '2026-10-12T00:00:00Z', completedAt: null, lastLessonSlug: null, completedLessonSlugs: [], totalLessons: 4, passedQuizSlugs: [], totalQuizzes: 1 }
const url = '/cursos/csharp/cuestionarios/q1'

function mockEnrolled(result: AttemptResult) {
  return mockApi({
    'GET /api/auth/me': () => jsonResponse(ana),
    'GET /api/catalog/courses/csharp/quizzes/q1': () => jsonResponse(quiz),
    'GET /api/learning/courses/csharp/progress': () => jsonResponse(enrolled),
    'GET /api/learning/courses/csharp/quizzes/q1/attempts': () => jsonResponse([]),
    'POST /api/learning/courses/csharp/quizzes/q1/attempts': () => jsonResponse(result),
  })
}

const failed: AttemptResult = {
  attemptId: 'a1',
  submittedAt: '2026-10-12T10:00:00Z',
  scorePercent: 50,
  passed: false,
  passingScorePercent: 70,
  questions: [
    { questionId: 'p1', correct: true, pointsAwarded: 1, explanationMarkdown: 'El SDK compila y ejecuta.', hintMarkdown: null, lessonSlug: null, correctOptionIds: null, acceptedAnswer: null },
    { questionId: 'p2', correct: false, pointsAwarded: 0, explanationMarkdown: null, hintMarkdown: 'Empieza por `dotnet`.', lessonSlug: 'tu-primer-programa', correctOptionIds: null, acceptedAnswer: null },
  ],
}

async function answerAll() {
  await userEvent.click(await screen.findByLabelText('El SDK'))
  await userEvent.type(screen.getByLabelText('Tu respuesta'), 'dotnet hola')
}

describe('cuestionario', () => {
  it('sin cuenta muestra las preguntas pero no permite enviar', async () => {
    mockApi({ 'GET /api/catalog/courses/csharp/quizzes/q1': () => jsonResponse(quiz) })

    renderRoute(url)

    expect(await screen.findByRole('heading', { level: 1, name: quiz.title })).toBeInTheDocument()
    expect(screen.getByText('Puedes ver las preguntas sin cuenta')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Enviar respuestas' })).toBeDisabled()
  })

  it('avisa de las preguntas sin responder antes de enviar', async () => {
    mockEnrolled(failed)
    renderRoute(url)

    await userEvent.click(await screen.findByLabelText('El SDK'))
    await userEvent.click(screen.getByRole('button', { name: 'Enviar respuestas' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Responde la pregunta 2')
  })

  it('al suspender muestra la nota, las pistas y la lección para repasar, sin las soluciones', async () => {
    mockEnrolled(failed)
    renderRoute(url)

    await answerAll()
    await userEvent.click(screen.getByRole('button', { name: 'Enviar respuestas' }))

    const heading = await screen.findByRole('heading', { name: /Aún no: has sacado un 50 %/ })
    expect(heading).toHaveFocus()
    expect(screen.getByText('Correcta')).toBeInTheDocument()
    expect(screen.getByText('Incorrecta')).toBeInTheDocument()
    expect(screen.getByText('dotnet', { selector: 'code' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'tu-primer-programa' })).toHaveAttribute('href', '/cursos/csharp/lecciones/tu-primer-programa')
    expect(screen.queryByText('Respuesta correcta')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Intentar de nuevo' })).toBeInTheDocument()
  })

  it('al aprobar marca las respuestas correctas', async () => {
    mockEnrolled({
      ...failed,
      scorePercent: 100,
      passed: true,
      questions: [
        { ...failed.questions[0]!, correctOptionIds: ['sdk'] },
        { ...failed.questions[1]!, correct: true, hintMarkdown: null, explanationMarkdown: 'Así se ejecuta.', acceptedAnswer: 'dotnet run hola.cs' },
      ],
    })
    renderRoute(url)

    await answerAll()
    await userEvent.click(screen.getByRole('button', { name: 'Enviar respuestas' }))

    expect(await screen.findByRole('heading', { name: /¡Aprobado!/ })).toBeInTheDocument()
    expect(screen.getByText('Respuesta correcta')).toBeInTheDocument()
    expect(screen.getByText('dotnet run hola.cs')).toBeInTheDocument()
  })
})
