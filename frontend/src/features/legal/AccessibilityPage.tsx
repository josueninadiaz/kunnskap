import { Accessibility, Ear, Eye, Hand, Keyboard, MessageSquareText, Type, Wifi } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { ReadingPreferencesButton } from '../../components/ui/ReadingPreferences'
import { sourceUrl } from '../../lib/legal'

const available = [
  {
    Icon: Ear,
    title: 'Si eres sorda, sordo o tienes dificultades auditivas',
    items: [
      'Todo el contenido de los cursos es texto: puedes aprender sin escuchar nada.',
      'Si una lección incluye un video, tiene que incluir su transcripción completa (la plataforma no deja publicarla sin ella).',
      'Las grabaciones de las sesiones en vivo se publicarán con subtítulos.',
    ],
  },
  {
    Icon: MessageSquareText,
    title: 'Si no hablas o prefieres no hacerlo',
    items: [
      'Nada en la plataforma requiere hablar, usar el micrófono ni la cámara.',
      'En las sesiones en vivo puedes participar por escrito en el chat, con la misma atención que quien habla.',
    ],
  },
  {
    Icon: Eye,
    title: 'Si eres ciega, ciego o tienes baja visión',
    items: [
      'La web funciona con lectores de pantalla (NVDA, VoiceOver, TalkBack, Narrador) y está estructurada con encabezados y regiones.',
      'Puedes agrandar el texto, usar una tipografía de alta legibilidad y elegir tema claro u oscuro.',
      'Los colores cumplen el contraste mínimo de WCAG 2.2 AA en ambos temas.',
    ],
  },
  {
    Icon: Type,
    title: 'Si tienes dislexia o te cuesta leer',
    items: [
      'Cada lección se puede escuchar en voz alta con el botón «Escuchar la lección».',
      'Puedes aumentar el espaciado entre líneas, letras y palabras.',
      'Las lecciones son cortas, en lenguaje claro y con ejemplos.',
    ],
  },
  {
    Icon: Keyboard,
    title: 'Si usas el teclado u otros dispositivos',
    items: [
      'Todo se puede hacer con el teclado, con un foco siempre visible y un enlace para saltar al contenido.',
      'Los botones tienen un tamaño cómodo (44 píxeles) para dedos y punteros.',
      'No hay límites de tiempo para leer ni para hacer las actividades.',
    ],
  },
  {
    Icon: Hand,
    title: 'Si el movimiento en pantalla te molesta',
    items: ['Puedes reducir todas las animaciones, aunque tu sistema no lo tenga configurado.'],
  },
  {
    Icon: Wifi,
    title: 'Si tu conexión o tu equipo son modestos',
    items: [
      'Las páginas son ligeras y los efectos 3D solo se cargan cuando el equipo puede con ellos.',
      'Puedes programar desde el navegador con GitHub Codespaces, sin instalar nada.',
    ],
  },
] as const

const missing = [
  'Interpretación en lengua de señas (LSE, LSM, LSA u otras). Si conoces una y quieres colaborar, nos encantará contar contigo.',
  'Subtítulos en directo durante las sesiones en vivo: dependen de la herramienta de videollamada y todavía no podemos garantizarlos.',
  'Una auditoría de accesibilidad completa por personas expertas: está prevista antes del lanzamiento público.',
] as const

export function AccessibilityPage() {
  const reportUrl = sourceUrl ? `${sourceUrl}/issues/new?template=accesibilidad.yml` : null

  return (
    <div className="max-w-3xl space-y-14">
      <PageHeader
        title="Accesibilidad e inclusión"
        description="Queremos que cualquier persona pueda aprender aquí, sin importar cómo ve, oye, habla, se mueve o lee. Esto es lo que ya hay y lo que nos falta."
      />

      <section aria-labelledby="ajustes" className="flex flex-col gap-4 rounded-(--radius-panel) border border-border bg-band p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 id="ajustes" className="flex items-center gap-2 text-xl font-semibold">
            <Accessibility aria-hidden="true" className="size-5 text-accent" />
            Ajusta la web a tu manera
          </h2>
          <p className="text-fg-muted">Tamaño del texto, espaciado, tipografía, animaciones y tema.</p>
        </div>
        <div className="sm:w-72">
          <ReadingPreferencesButton wide />
        </div>
      </section>

      <section aria-labelledby="disponible" className="space-y-8">
        <h2 id="disponible" className="text-2xl font-semibold tracking-[-0.025em]">
          Lo que ya puedes hacer
        </h2>
        {available.map(({ Icon, title, items }) => (
          <div key={title} className="grid gap-3 sm:grid-cols-[2.5rem_1fr]">
            <Icon aria-hidden="true" className="size-6 text-accent" strokeWidth={1.75} />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">{title}</h3>
              <ul className="list-disc space-y-1.5 pl-5 text-fg-muted marker:text-accent">
                {items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </section>

      <section aria-labelledby="falta" className="space-y-4">
        <h2 id="falta" className="text-2xl font-semibold tracking-[-0.025em]">
          Lo que todavía no ofrecemos
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-fg-muted marker:text-warning">
          {missing.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="barrera" className="space-y-4">
        <h2 id="barrera" className="text-2xl font-semibold tracking-[-0.025em]">
          ¿Algo te impide aprender?
        </h2>
        <p className="text-fg-muted">
          Cuéntanoslo: es la información más valiosa que podemos recibir. Explica qué intentabas hacer, qué pasó y, si
          quieres, qué herramienta de apoyo usas.
        </p>
        {reportUrl ? (
          <a href={reportUrl} className="inline-flex min-h-11 items-center rounded-full bg-accent px-5 font-medium text-accent-fg hover:bg-accent-hover">
            Informar de una barrera
          </a>
        ) : null}
        <p className="text-sm text-fg-muted">
          Por ahora los informes se envían en GitHub y necesitas una cuenta gratuita. Estamos preparando un formulario
          dentro de la plataforma.
        </p>
      </section>
    </div>
  )
}
