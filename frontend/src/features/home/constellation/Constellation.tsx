import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import dotnetLogo from '../../../assets/brand/dotnet-logo.svg'
import { apiGet } from '../../../lib/api'
import { prefersReducedMotion } from '../../../lib/preferences'
import { type CourseListItem, type Paged, useCatalogFacets } from '../../catalog/catalogApi'
import { buildConstellation, type Constellation as ConstellationData, project, rotate } from './layout'

/** ¿Merece la pena cargar la escena 3D en este equipo? */
function canRender3D(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  if (prefersReducedMotion()) return false
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  if (connection?.saveData) return false
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}

const STATIC_YAW = 0.6
const STATIC_PITCH = 0.35

function useConstellationData(): ConstellationData | null {
  const facets = useCatalogFacets()
  const courses = useQuery({
    queryKey: ['catalog', 'constellation'],
    queryFn: ({ signal }) => apiGet<Paged<CourseListItem>>('/catalog/courses?page=1&pageSize=50', { signal }),
  })

  return useMemo(() => {
    if (!facets.data || !courses.data || courses.data.items.length === 0) return null
    return buildConstellation(
      courses.data.items.map((c) => ({
        slug: c.slug,
        title: c.title,
        school: c.school.slug,
        published: c.status === 'Published',
        technologies: c.technologies.map((t) => t.slug),
      })),
      facets.data.technologies,
    )
  }, [facets.data, courses.data])
}

/**
 * Constelación del catálogo: cursos (puntos), rutas (líneas) y tecnologías (estrellas con enlace).
 * Primero se pinta una versión estática en SVG; en equipos capaces se sustituye por la escena 3D.
 */
export function Constellation() {
  const data = useConstellationData()
  const [use3D] = useState(canRender3D)
  const [ready3D, setReady3D] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const labelRefs = useRef(new Map<number, HTMLElement>())

  const projected = useMemo(
    () => data?.nodes.map((n) => project(rotate(n.position, STATIC_YAW, STATIC_PITCH))) ?? [],
    [data],
  )

  useEffect(() => {
    if (!use3D || !data || !containerRef.current || !canvasRef.current) return
    let disposed = false
    let handle: { dispose(): void } | undefined
    void import('./scene')
      .then(({ createConstellationScene }) => {
        if (disposed || !containerRef.current || !canvasRef.current) return
        for (const el of labelRefs.current.values()) {
          el.style.left = '0'
          el.style.top = '0'
        }
        handle = createConstellationScene(containerRef.current, canvasRef.current, data, labelRefs.current)
        setReady3D(true)
      })
      .catch(() => {
        // Si la escena no carga (red, GPU), se mantiene la versión estática.
      })
    return () => {
      disposed = true
      handle?.dispose()
    }
  }, [use3D, data])

  const technologies = data?.nodes.flatMap((node, index) => (node.kind === 'technology' ? [{ node, index }] : [])) ?? []

  return (
    <div
      ref={containerRef}
      className={`relative mx-auto aspect-square w-full max-w-[38rem] touch-pan-y select-none ${use3D ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      {/* Versión estática: siempre presente al cargar; se desvanece cuando la 3D está lista. */}
      {data ? (
        <svg
          viewBox="0 0 100 100"
          aria-hidden="true"
          className={`absolute inset-0 size-full transition-opacity duration-700 ${ready3D ? 'opacity-0' : 'opacity-100'}`}
        >
          {[...data.technologyEdges, ...data.pathEdges].map(([a, b]) => (
            <line
              key={`${a}-${b}`}
              x1={projected[a]!.x * 100}
              y1={projected[a]!.y * 100}
              x2={projected[b]!.x * 100}
              y2={projected[b]!.y * 100}
              stroke={data.nodes[b]!.kind === 'technology' && data.nodes[b]!.microsoft ? 'var(--dotnet-bright)' : 'var(--stage-accent)'}
              strokeOpacity={data.nodes[b]!.kind === 'technology' ? 0.2 : 0.45}
              strokeWidth={0.15}
            />
          ))}
          {data.nodes.map((n, i) => (
            <circle
              key={n.id}
              cx={projected[i]!.x * 100}
              cy={projected[i]!.y * 100}
              r={(n.kind === 'technology' ? 1.1 : 0.55) * projected[i]!.scale}
              fill={n.microsoft ? 'var(--dotnet-bright)' : n.published ? 'var(--stage-accent)' : 'var(--stage-muted)'}
              opacity={projected[i]!.depth > -0.2 ? 0.95 : 0.4}
            />
          ))}
        </svg>
      ) : null}

      <canvas ref={canvasRef} aria-hidden="true" className={`absolute inset-0 size-full ${use3D ? '' : 'hidden'}`} />

      <img
        src={dotnetLogo}
        alt=".NET"
        width={56}
        height={56}
        className="pointer-events-none absolute top-1/2 left-1/2 size-12 -translate-x-1/2 -translate-y-1/2 rounded-xl shadow-[0_0_60px_rgb(81_43_212/0.6)] sm:size-14"
      />

      <nav aria-label="Explorar cursos por tecnología" className="absolute inset-0">
        <ul>
          {technologies.map(({ node, index }) => (
            <li key={node.id}>
              <Link
                to={node.href}
                ref={(el) => {
                  if (el) labelRefs.current.set(index, el)
                  else labelRefs.current.delete(index)
                }}
                style={{ left: `${projected[index]!.x * 100}%`, top: `${projected[index]!.y * 100}%`, transform: 'translate(-50%, -50%)' }}
                className={`absolute rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap backdrop-blur-sm transition-colors sm:text-[0.8125rem] ${
                  node.microsoft
                    ? 'border-dotnet-bright/50 bg-dotnet/30 text-stage-fg hover:bg-dotnet'
                    : 'border-stage-border bg-stage-raised/70 text-stage-muted hover:text-stage-fg'
                }`}
              >
                {node.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
