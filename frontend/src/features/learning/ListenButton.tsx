import { Pause, Play, Square, Volume2 } from 'lucide-react'
import { type RefObject, useEffect, useRef, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { readableText, speechChunks } from './speech'

type Status = 'idle' | 'playing' | 'paused'

const supported = () => typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window

/**
 * «Escuchar la lección»: lectura en voz alta con la síntesis de voz del propio navegador
 * (gratuita, sin enviar el texto a ningún servicio). Útil con baja visión, dislexia o para
 * aprender escuchando. Si el navegador no la admite, el botón no aparece.
 */
export function ListenButton({ target, intro }: { target: RefObject<HTMLElement | null>; intro: string }) {
  const [status, setStatus] = useState<Status>('idle')
  const [rate, setRate] = useState(1)
  const session = useRef(0)

  // Al salir de la lección se detiene la lectura.
  useEffect(() => () => window.speechSynthesis?.cancel(), [])

  if (!supported()) return null

  const speak = () => {
    if (!target.current) return
    const synth = window.speechSynthesis
    synth.cancel()
    const id = ++session.current
    const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith('es'))
    const parts = speechChunks(`${intro}. ${readableText(target.current)}`)
    parts.forEach((part, index) => {
      const utterance = new SpeechSynthesisUtterance(part)
      utterance.lang = voice?.lang ?? 'es-ES'
      if (voice) utterance.voice = voice
      utterance.rate = rate
      if (index === parts.length - 1) {
        utterance.onend = () => {
          if (session.current === id) setStatus('idle')
        }
      }
      synth.speak(utterance)
    })
    setStatus('playing')
  }

  const pause = () => {
    window.speechSynthesis.pause()
    setStatus('paused')
  }

  const resume = () => {
    window.speechSynthesis.resume()
    setStatus('playing')
  }

  const stop = () => {
    session.current++
    window.speechSynthesis.cancel()
    setStatus('idle')
  }

  return (
    <fieldset data-no-speech className="flex flex-wrap items-center gap-2">
      <legend className="sr-only">Lectura en voz alta</legend>
      {status === 'idle' ? (
        <Button variant="secondary" onClick={speak}>
          <Volume2 aria-hidden="true" className="size-4" />
          Escuchar la lección
        </Button>
      ) : null}
      {status === 'playing' ? (
        <Button variant="secondary" onClick={pause}>
          <Pause aria-hidden="true" className="size-4" />
          Pausar
        </Button>
      ) : null}
      {status === 'paused' ? (
        <Button variant="secondary" onClick={resume}>
          <Play aria-hidden="true" className="size-4" />
          Continuar
        </Button>
      ) : null}
      {status !== 'idle' ? (
        <Button variant="ghost" onClick={stop}>
          <Square aria-hidden="true" className="size-4" />
          Detener
        </Button>
      ) : null}
      <label className="ml-1 inline-flex items-center gap-2 text-sm text-fg-muted">
        Velocidad
        <select
          value={rate}
          onChange={(e) => setRate(Number(e.target.value))}
          disabled={status !== 'idle'}
          className="min-h-9 rounded-(--radius-control) border border-border-strong bg-surface px-2 text-fg"
        >
          <option value={0.8}>Lenta</option>
          <option value={1}>Normal</option>
          <option value={1.2}>Rápida</option>
        </select>
      </label>
    </fieldset>
  )
}
