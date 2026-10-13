import { CheckCircle2, CircleAlert, XCircle } from 'lucide-react'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { Button, ButtonLink } from '../../components/ui/Button'
import { InlineMarkdown } from '../../components/ui/InlineMarkdown'
import { Markdown } from '../../components/ui/Markdown'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatusMessage } from '../../components/ui/StatusMessage'
import { describeError } from '../../lib/api'
import { useCurrentUser } from '../auth/authApi'
import { useCourse } from '../catalog/catalogApi'
import { useCourseProgress, useEnroll } from '../learning/learningApi'
import { type AnswerInput, type AttemptResult, type QuizView, useAttemptHistory, useQuiz, useSubmitAttempt } from './quizApi'

const dateFormat = new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' })
const percent = (value: number) => `${Number.isInteger(value) ? value : value.toFixed(1).replace('.', ',')} %`

type Answers = Record<string, { optionIds: string[]; text: string }>

export function QuizPage() {
  const { slug = '', quizSlug = '' } = useParams()
  const quiz = useQuiz(slug, quizSlug)

  if (quiz.isPending) return <StatusMessage tone="loading" title="Cargando el cuestionario…" />
  if (quiz.isError) {
    return (
      <StatusMessage tone="error" title="No se pudo cargar el cuestionario">
        {describeError(quiz.error)}
      </StatusMessage>
    )
  }
  if (quiz.data === null) {
    return (
      <section>
        <PageHeader title="Cuestionario no encontrado" description="Puede que la dirección sea incorrecta o que el curso aún no esté publicado." />
        <ButtonLink to={`/cursos/${slug}`}>Volver al curso</ButtonLink>
      </section>
    )
  }

  return <QuizContent quiz={quiz.data} />
}

function QuizContent({ quiz }: { quiz: QuizView }) {
  const location = useLocation()
  const user = useCurrentUser()
  const signedIn = Boolean(user.data)
  const progress = useCourseProgress(quiz.courseSlug, signedIn)
  const enroll = useEnroll(quiz.courseSlug)
  const course = useCourse(quiz.courseSlug)
  const history = useAttemptHistory(quiz.courseSlug, quiz.slug, Boolean(progress.data?.enrolled))
  const submit = useSubmitAttempt(quiz.courseSlug, quiz.slug)

  const [answers, setAnswers] = useState<Answers>({})
  const [missing, setMissing] = useState<number[]>([])
  const [result, setResult] = useState<AttemptResult | null>(null)
  const resultRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (result) resultRef.current?.focus()
  }, [result])

  const lessonTitles = new Map(course.data?.modules.flatMap((m) => m.lessons.map((l) => [l.slug, l.title] as const)) ?? [])
  const answerOf = (id: string) => answers[id] ?? { optionIds: [], text: '' }

  function setOption(questionId: string, optionId: string, multiple: boolean, checked: boolean) {
    const current = answerOf(questionId)
    const optionIds = multiple
      ? checked
        ? [...current.optionIds, optionId]
        : current.optionIds.filter((id) => id !== optionId)
      : [optionId]
    setAnswers({ ...answers, [questionId]: { ...current, optionIds } })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const unanswered = quiz.questions.flatMap((q, i) => {
      const a = answerOf(q.id)
      return (q.type === 'ShortAnswer' ? a.text.trim() === '' : a.optionIds.length === 0) ? [i + 1] : []
    })
    setMissing(unanswered)
    if (unanswered.length > 0) return

    const payload: AnswerInput[] = quiz.questions.map((q) =>
      q.type === 'ShortAnswer' ? { questionId: q.id, text: answerOf(q.id).text } : { questionId: q.id, optionIds: answerOf(q.id).optionIds },
    )
    submit.mutate(payload, { onSuccess: setResult })
  }

  function retry() {
    setResult(null)
    setAnswers({})
    setMissing([])
    window.scrollTo({ top: 0 })
  }

  const canSubmit = signedIn && progress.data?.enrolled
  const resultsById = new Map(result?.questions.map((r) => [r.questionId, r]))

  return (
    <article className="mx-auto max-w-(--container-prose)">
      <nav aria-label="Ruta de navegación" className="mb-4 text-sm text-fg-muted">
        <ol className="flex flex-wrap gap-1">
          <li>
            <Link to="/cursos" className="underline hover:text-fg">
              Cursos
            </Link>
            <span aria-hidden="true"> / </span>
          </li>
          <li>
            <Link to={`/cursos/${quiz.courseSlug}`} className="underline hover:text-fg">
              {quiz.courseTitle}
            </Link>
          </li>
        </ol>
      </nav>
      <p className="mb-2 text-sm font-medium text-accent">
        Módulo {quiz.moduleNumber}. {quiz.moduleTitle}
      </p>
      <PageHeader
        title={quiz.title}
        description={`${quiz.questions.length} preguntas. Necesitas un ${quiz.passingScorePercent} % para aprobar y puedes intentarlo las veces que quieras.`}
      />

      {result ? (
        <section aria-labelledby="resultado" className="mb-10 space-y-4">
          <div
            className={`space-y-3 rounded-(--radius-panel) border p-6 ${result.passed ? 'border-success/40 bg-success-soft' : 'border-warning/40 bg-warning-soft'}`}
          >
            <h2 id="resultado" ref={resultRef} tabIndex={-1} className="text-2xl font-semibold focus:outline-none">
              {result.passed ? `¡Aprobado! Has sacado un ${percent(result.scorePercent)}.` : `Aún no: has sacado un ${percent(result.scorePercent)}.`}
            </h2>
            <p>
              {result.passed
                ? 'Muy bien. Abajo tienes todas las explicaciones y las respuestas correctas.'
                : `Necesitas un ${result.passingScorePercent} %. Revisa las pistas de las preguntas marcadas y vuelve a intentarlo: equivocarse es parte de aprender.`}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={retry} variant={result.passed ? 'secondary' : 'primary'}>
                Intentar de nuevo
              </Button>
              <ButtonLink to={`/cursos/${quiz.courseSlug}`} variant={result.passed ? 'primary' : 'secondary'}>
                Volver al curso
              </ButtonLink>
            </div>
          </div>
        </section>
      ) : null}

      {!user.isPending && !signedIn ? (
        <StatusMessage tone="info" title="Puedes ver las preguntas sin cuenta">
          Para enviar tus respuestas y guardar el resultado,{' '}
          <Link to={`/entrar?volver=${encodeURIComponent(location.pathname)}`} className="font-medium underline">
            entra
          </Link>{' '}
          o{' '}
          <Link to="/registro" className="font-medium underline">
            crea una cuenta gratuita
          </Link>
          .
        </StatusMessage>
      ) : null}

      {signedIn && progress.data && !progress.data.enrolled ? (
        <StatusMessage
          tone="info"
          title="Inscríbete para guardar tu resultado"
          action={
            <Button onClick={() => enroll.mutate()} disabled={enroll.isPending}>
              Inscribirme gratis
            </Button>
          }
        />
      ) : null}

      <form noValidate onSubmit={handleSubmit} className="mt-8 space-y-10">
        {missing.length > 0 ? (
          <StatusMessage tone="error" title="Te falta responder alguna pregunta">
            Responde {missing.length === 1 ? 'la pregunta' : 'las preguntas'} {missing.join(', ')} antes de enviar.
          </StatusMessage>
        ) : null}

        {quiz.questions.map((question, index) => {
          const r = resultsById.get(question.id)
          const promptId = `pregunta-${question.id}`
          const multiple = question.type === 'MultipleChoice'
          const a = answerOf(question.id)
          return (
            <fieldset
              key={question.id}
              aria-describedby={promptId}
              disabled={Boolean(result)}
              className="space-y-4 rounded-(--radius-panel) border border-border bg-surface p-6"
            >
              <legend className="sr-only">
                Pregunta {index + 1} de {quiz.questions.length}
              </legend>
              <p aria-hidden="true" className="text-sm text-fg-muted">
                Pregunta {index + 1} de {quiz.questions.length}
                {multiple ? '. Marca todas las correctas.' : ''}
              </p>
              <div id={promptId} className="text-lg font-semibold">
                <Markdown>{question.promptMarkdown}</Markdown>
              </div>

              {question.type === 'ShortAnswer' ? (
                <div className="space-y-1.5">
                  <label htmlFor={`respuesta-${question.id}`} className="block text-sm font-medium text-fg-muted">
                    Tu respuesta
                  </label>
                  <input
                    id={`respuesta-${question.id}`}
                    value={a.text}
                    maxLength={200}
                    autoComplete="off"
                    spellCheck={false}
                    onChange={(e) => setAnswers({ ...answers, [question.id]: { ...a, text: e.target.value } })}
                    className="block min-h-11 w-full rounded-(--radius-control) border border-border-strong bg-surface px-3 font-mono text-fg"
                  />
                  {r?.acceptedAnswer ? (
                    <p className="text-sm">
                      Respuesta correcta: <code className="rounded bg-code-bg px-1.5 py-0.5 font-mono">{r.acceptedAnswer}</code>
                    </p>
                  ) : null}
                </div>
              ) : (
                <ul className="space-y-2">
                  {question.options.map((option) => {
                    const isCorrect = r?.correctOptionIds?.includes(option.id)
                    return (
                      <li key={option.id}>
                        <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-(--radius-control) border border-border px-4 py-3 has-[:checked]:border-accent has-[:checked]:bg-accent-soft">
                          <input
                            type={multiple ? 'checkbox' : 'radio'}
                            name={question.id}
                            checked={a.optionIds.includes(option.id)}
                            onChange={(e) => setOption(question.id, option.id, multiple, e.target.checked)}
                            className="mt-1 size-4 shrink-0 accent-accent"
                          />
                          <span className="flex-1">
                            <InlineMarkdown>{option.textMarkdown}</InlineMarkdown>
                            {isCorrect ? (
                              <span className="ml-2 inline-flex items-center gap-1 text-sm font-medium text-success">
                                <CheckCircle2 aria-hidden="true" className="size-4" />
                                Respuesta correcta
                              </span>
                            ) : null}
                          </span>
                        </label>
                      </li>
                    )
                  })}
                </ul>
              )}

              {r ? <Feedback result={r} courseSlug={quiz.courseSlug} lessonTitles={lessonTitles} /> : null}
            </fieldset>
          )
        })}

        {submit.isError ? (
          <StatusMessage tone="error" title="No se pudieron enviar las respuestas">
            {describeError(submit.error)}
          </StatusMessage>
        ) : null}

        {!result ? (
          <Button type="submit" size="lg" disabled={!canSubmit || submit.isPending}>
            {submit.isPending ? 'Corrigiendo…' : 'Enviar respuestas'}
          </Button>
        ) : null}
      </form>

      {history.data && history.data.length > 0 ? (
        <section aria-labelledby="historial" className="mt-14 space-y-3">
          <h2 id="historial" className="text-xl font-semibold">
            Tus intentos
          </h2>
          <ol className="divide-y divide-border border-y border-border text-[0.9375rem]">
            {history.data.map((attempt) => (
              <li key={attempt.attemptId} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <span className="text-fg-muted">{dateFormat.format(new Date(attempt.submittedAt))}</span>
                <span className="tabular-nums">
                  {percent(attempt.scorePercent)}, {attempt.passed ? 'aprobado' : 'sin aprobar'}
                </span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </article>
  )
}

function Feedback({
  result,
  courseSlug,
  lessonTitles,
}: {
  result: AttemptResult['questions'][number]
  courseSlug: string
  lessonTitles: Map<string, string>
}) {
  const lessonTitle = result.lessonSlug ? lessonTitles.get(result.lessonSlug) : undefined
  return (
    <div className={`space-y-2 rounded-(--radius-control) p-4 ${result.correct ? 'bg-success-soft' : 'bg-warning-soft'}`}>
      <p className="flex items-center gap-2 font-semibold">
        {result.correct ? (
          <CheckCircle2 aria-hidden="true" className="size-5 text-success" />
        ) : (
          <XCircle aria-hidden="true" className="size-5 text-warning" />
        )}
        {result.correct ? 'Correcta' : 'Incorrecta'}
      </p>
      {result.explanationMarkdown ? <Markdown>{result.explanationMarkdown}</Markdown> : null}
      {result.hintMarkdown ? (
        <div className="flex gap-2">
          <CircleAlert aria-hidden="true" className="mt-1 size-4 shrink-0" />
          <div>
            <span className="font-medium">Pista: </span>
            <InlineMarkdown>{result.hintMarkdown}</InlineMarkdown>
          </div>
        </div>
      ) : null}
      {!result.correct && result.lessonSlug ? (
        <p className="text-[0.9375rem]">
          Repasa la lección{' '}
          <Link to={`/cursos/${courseSlug}/lecciones/${result.lessonSlug}`} className="font-medium text-accent underline">
            {lessonTitle ?? result.lessonSlug}
          </Link>
          .
        </p>
      ) : null}
    </div>
  )
}
