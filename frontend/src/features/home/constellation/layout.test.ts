import { describe, expect, it } from 'vitest'
import { buildConstellation, type ConstellationCourse, project, rotate } from './layout'

const courses: ConstellationCourse[] = [
  { slug: 'a', title: 'A', school: 'fundamentos', published: true, technologies: ['csharp'] },
  { slug: 'b', title: 'B', school: 'fundamentos', published: false, technologies: ['csharp', 'git'] },
  { slug: 'c', title: 'C', school: 'web', published: false, technologies: ['css'] },
]
const technologies = [
  { slug: 'csharp', name: 'C#' },
  { slug: 'git', name: 'Git' },
  { slug: 'css', name: 'CSS' },
  { slug: 'python', name: 'Python' },
]

describe('buildConstellation', () => {
  const data = buildConstellation(courses, technologies)

  it('crea un nodo por curso y por tecnología usada (sin tecnologías huérfanas)', () => {
    expect(data.nodes.filter((n) => n.kind === 'course')).toHaveLength(3)
    expect(data.nodes.filter((n) => n.kind === 'technology').map((n) => n.label)).toEqual(['C#', 'Git', 'CSS'])
  })

  it('une solo cursos consecutivos de la misma escuela (el orden de la ruta)', () => {
    expect(data.pathEdges).toEqual([[0, 1]])
  })

  it('une cada tecnología con sus cursos', () => {
    const csharp = data.nodes.findIndex((n) => n.label === 'C#')
    expect(data.technologyEdges.filter(([, t]) => t === csharp).map(([c]) => c)).toEqual([0, 1])
  })

  it('marca las tecnologías de Microsoft y enlaza al catálogo filtrado', () => {
    const csharp = data.nodes.find((n) => n.label === 'C#')!
    expect(csharp.microsoft).toBe(true)
    expect(csharp.href).toBe('/cursos?tecnologia=csharp')
    expect(data.nodes.find((n) => n.label === 'CSS')!.microsoft).toBe(false)
  })

  it('coloca las tecnologías fuera de la esfera de cursos', () => {
    const radius = (kind: string) => data.nodes.filter((n) => n.kind === kind).map((n) => Math.hypot(...n.position))

    expect(radius('course').every((r) => Math.abs(r - 1) < 1e-6)).toBe(true)
    expect(Math.min(...radius('technology'))).toBeGreaterThan(1.15)
  })
})

describe('proyección', () => {
  it('rotar conserva la distancia al centro', () => {
    expect(Math.hypot(...rotate([0.3, -0.4, 0.5], 1.1, 0.4))).toBeCloseTo(Math.hypot(0.3, -0.4, 0.5), 10)
  })

  it('el centro se proyecta en el centro del lienzo', () => {
    expect(project([0, 0, 0])).toMatchObject({ x: 0.5, y: 0.5 })
  })
})
