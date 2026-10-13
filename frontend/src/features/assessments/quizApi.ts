import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, apiGet, apiSend } from '../../lib/api'

export type QuestionType = 'SingleChoice' | 'MultipleChoice' | 'ShortAnswer'

export interface QuizView {
  courseSlug: string
  courseTitle: string
  moduleNumber: number
  moduleTitle: string
  slug: string
  title: string
  passingScorePercent: number
  questions: { id: string; type: QuestionType; promptMarkdown: string; points: number; options: { id: string; textMarkdown: string }[] }[]
}

export interface QuestionResult {
  questionId: string
  correct: boolean
  pointsAwarded: number
  explanationMarkdown: string | null
  hintMarkdown: string | null
  lessonSlug: string | null
  correctOptionIds: string[] | null
  acceptedAnswer: string | null
}

export interface AttemptResult {
  attemptId: string
  submittedAt: string
  scorePercent: number
  passed: boolean
  passingScorePercent: number
  questions: QuestionResult[]
}

export interface AttemptSummary {
  attemptId: string
  submittedAt: string
  scorePercent: number
  passed: boolean
}

export interface AnswerInput {
  questionId: string
  optionIds?: string[]
  text?: string
}

const base = (course: string, quiz: string) =>
  `/learning/courses/${encodeURIComponent(course)}/quizzes/${encodeURIComponent(quiz)}/attempts`

export function useQuiz(courseSlug: string, quizSlug: string) {
  return useQuery({
    queryKey: ['quiz', courseSlug, quizSlug],
    queryFn: async ({ signal }) => {
      try {
        return await apiGet<QuizView>(
          `/catalog/courses/${encodeURIComponent(courseSlug)}/quizzes/${encodeURIComponent(quizSlug)}`,
          { signal },
        )
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null
        throw error
      }
    },
  })
}

export function useAttemptHistory(courseSlug: string, quizSlug: string, enabled: boolean) {
  return useQuery({
    queryKey: ['quiz-history', courseSlug, quizSlug],
    queryFn: ({ signal }) => apiGet<AttemptSummary[]>(base(courseSlug, quizSlug), { signal }),
    enabled,
  })
}

export function useSubmitAttempt(courseSlug: string, quizSlug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (answers: AnswerInput[]) => apiSend<AttemptResult>('POST', base(courseSlug, quizSlug), { answers }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['quiz-history', courseSlug, quizSlug] })
      void queryClient.invalidateQueries({ queryKey: ['learning', 'progress', courseSlug] })
    },
  })
}
