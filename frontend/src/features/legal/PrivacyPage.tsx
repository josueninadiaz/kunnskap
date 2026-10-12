import { PageHeader } from '../../components/ui/PageHeader'
import { config } from '../../lib/config'

/*
 * Resumen honesto del tratamiento de datos actual. Debe actualizarse con cada funcionalidad que
 * recoja datos nuevos y revisarse legalmente antes del lanzamiento público.
 */
export function PrivacyPage() {
  return (
    <section className="max-w-(--container-prose)">
      <PageHeader title="Privacidad" description={`Qué datos guarda ${config.platformName} y para qué.`} />

      <div className="space-y-8">
        <p className="rounded-(--radius-panel) border border-warning/40 bg-warning-soft px-4 py-3 text-sm">
          Esta es una versión inicial, pendiente de revisión legal antes del lanzamiento público.
        </p>

        <div className="space-y-3">
          <h2 className="text-xl">Datos que guardamos</h2>
          <ul className="list-disc space-y-2 pl-5 marker:text-accent">
            <li>Tu correo electrónico, para que puedas iniciar sesión.</li>
            <li>El nombre o apodo que elijas, para dirigirnos a ti.</li>
            <li>
              Tu contraseña, nunca en texto legible: solo guardamos un resumen cifrado (hash) que no permite recuperarla.
            </li>
            <li>Más adelante, tu progreso en los cursos y los resultados de tus evaluaciones.</li>
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl">Lo que no hacemos</h2>
          <ul className="list-disc space-y-2 pl-5 marker:text-accent">
            <li>No vendemos ni compartimos tus datos con anunciantes.</li>
            <li>No usamos herramientas de analítica ni publicidad de terceros.</li>
            <li>No te pedimos más datos de los necesarios.</li>
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl">Cookies</h2>
          <p>
            Usamos solo cookies técnicas imprescindibles: una para mantener tu sesión iniciada y otra para proteger los
            formularios frente a ataques. No usamos cookies de seguimiento.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl">Menores de edad</h2>
          <p>
            Si eres menor de edad según la ley de tu país, pide permiso a tu madre, padre o tutor antes de crear una
            cuenta.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl">Tus derechos</h2>
          <p>
            Tienes derecho a obtener una copia de tus datos y a eliminar tu cuenta. La opción para hacerlo desde tu
            perfil está en desarrollo y estará disponible antes del lanzamiento público.
          </p>
        </div>
      </div>
    </section>
  )
}
