import { PageHeader } from '../../components/ui/PageHeader'
import { config } from '../../lib/config'

const ways = [
  {
    title: 'Si desarrollas software',
    items: [
      'Lee la guía de desarrollo local (docs/desarrollo-local.md) para ejecutar el proyecto en tu equipo.',
      'Busca las issues marcadas como «buena primera contribución».',
      'Abre un pull request pequeño, con pruebas y una descripción clara del cambio.',
    ],
  },
  {
    title: 'Si enseñas o dominas un tema',
    items: [
      'Revisa lecciones existentes y señala errores o explicaciones confusas.',
      'Propón ejercicios, ejemplos o proyectos prácticos.',
      'Enlaza siempre documentación oficial que respalde cada afirmación técnica.',
    ],
  },
  {
    title: 'Si estás aprendiendo',
    items: [
      'Cuéntanos qué no entendiste: es la información más valiosa para mejorar un curso.',
      'Reporta errores de la plataforma o problemas de accesibilidad.',
    ],
  },
] as const

export function ContributePage() {
  return (
    <section className="max-w-(--container-prose)">
      <PageHeader
        title="Cómo contribuir"
        description={`${config.platformName} es un proyecto abierto. Cualquier ayuda, grande o pequeña, mejora la experiencia de quienes aprenden.`}
      />

      <div className="space-y-10">
        {ways.map((way) => (
          <div key={way.title} className="space-y-3">
            <h2 className="text-xl">{way.title}</h2>
            <ul className="list-disc space-y-2 pl-5 marker:text-accent">
              {way.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}

        <div className="space-y-3">
          <h2 className="text-xl">Normas básicas</h2>
          <p className="text-fg-muted">
            Todas las contribuciones siguen el código de conducta del proyecto. El código se publica bajo licencia GNU
            AGPL-3.0 y el contenido educativo bajo CC BY-SA 4.0: quien modifique la plataforma y la ofrezca a otras
            personas debe publicar su código y mantener la atribución al autor original. No incluyas material de terceros sin permiso ni datos personales
            de nadie.
          </p>
        </div>
      </div>
    </section>
  )
}
