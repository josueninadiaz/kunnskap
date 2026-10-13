/**
 * Geometría de la constelación del catálogo (función pura, sin three.js).
 *
 * - Cada curso es un punto sobre una esfera; los cursos de una misma escuela quedan juntos
 *   (distribución de Fibonacci en orden de escuela y de curso).
 * - Las líneas unen cursos consecutivos de una escuela: el orden real de la ruta.
 * - Las tecnologías se reparten de forma uniforme en una esfera exterior (así sus etiquetas no se
 *   amontonan) y se unen a sus cursos: las líneas cruzan la esfera como una red de conocimiento.
 */

export interface ConstellationCourse {
  slug: string
  title: string
  school: string
  published: boolean
  technologies: string[]
}

export interface ConstellationTechnology {
  slug: string
  name: string
}

export type Vec3 = [number, number, number]

export interface ConstellationNode {
  id: string
  kind: 'course' | 'technology'
  label: string
  position: Vec3
  /** Tecnología del ecosistema Microsoft/.NET (se dibuja en violeta .NET). */
  microsoft: boolean
  published: boolean
  /** Ruta de la web a la que lleva el nodo. */
  href: string
}

export interface Constellation {
  nodes: ConstellationNode[]
  /** Pares de índices de `nodes`. */
  pathEdges: [number, number][]
  technologyEdges: [number, number][]
}

/** Tecnologías del ecosistema Microsoft presentes en el catálogo. */
export const MICROSOFT_TECHNOLOGIES = new Set(['csharp', 'dotnet', 'aspnetcore', 'efcore', 'typescript', 'github'])

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

function fibonacciPoint(index: number, count: number, radius: number): Vec3 {
  const y = count === 1 ? 0 : 1 - (index / (count - 1)) * 2
  const r = Math.sqrt(1 - y * y)
  const theta = GOLDEN_ANGLE * index
  return [Math.cos(theta) * r * radius, y * radius, Math.sin(theta) * r * radius]
}

export function buildConstellation(
  courses: ConstellationCourse[],
  technologies: ConstellationTechnology[],
  radius = 1,
): Constellation {
  const nodes: ConstellationNode[] = courses.map((course, i) => ({
    id: `curso:${course.slug}`,
    kind: 'course',
    label: course.title,
    position: fibonacciPoint(i, courses.length, radius),
    microsoft: course.technologies.some((t) => MICROSOFT_TECHNOLOGIES.has(t)),
    published: course.published,
    href: `/cursos/${course.slug}`,
  }))

  const pathEdges: [number, number][] = []
  for (let i = 1; i < courses.length; i++) {
    if (courses[i]?.school === courses[i - 1]?.school) pathEdges.push([i - 1, i])
  }

  const technologyEdges: [number, number][] = []
  const used = technologies.filter((tech) => courses.some((c) => c.technologies.includes(tech.slug)))
  used.forEach((tech, t) => {
    const index = nodes.length
    // Desfase del índice para que las tecnologías no coincidan con los polos de los cursos.
    const [x, y, z] = fibonacciPoint(t, used.length, radius * 1.32)
    nodes.push({
      id: `tecnologia:${tech.slug}`,
      kind: 'technology',
      label: tech.name,
      position: [z, y * 0.92, -x],
      microsoft: MICROSOFT_TECHNOLOGIES.has(tech.slug),
      published: true,
      href: `/cursos?tecnologia=${tech.slug}`,
    })
    courses.forEach((c, i) => {
      if (c.technologies.includes(tech.slug)) technologyEdges.push([i, index])
    })
  })

  return { nodes, pathEdges, technologyEdges }
}

/** Rota alrededor del eje Y y luego del X (radianes). */
export function rotate([x, y, z]: Vec3, yaw: number, pitch: number): Vec3 {
  const cy = Math.cos(yaw)
  const sy = Math.sin(yaw)
  const x1 = x * cy + z * sy
  const z1 = -x * sy + z * cy
  const cp = Math.cos(pitch)
  const sp = Math.sin(pitch)
  return [x1, y * cp - z1 * sp, y * sp + z1 * cp]
}

/** Proyección en perspectiva a coordenadas 0..1 (para la versión estática en SVG). */
export function project(point: Vec3, distance = 3.2): { x: number; y: number; depth: number; scale: number } {
  const scale = distance / (distance - point[2])
  return { x: 0.5 + (point[0] * scale) / 3.4, y: 0.5 - (point[1] * scale) / 3.4, depth: point[2], scale }
}
