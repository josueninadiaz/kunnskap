import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { apiCalls, jsonResponse, mockApi, renderRoute } from '../../test/render'
import type { CourseDetail, CourseListItem } from './catalogApi'
import { formatDuration } from './catalogApi'

const csharp: CourseListItem = {
  slug: 'programar-desde-cero-con-csharp',
  title: 'Programar desde cero con C#',
  summary: 'Aprende lógica de programación con C#.',
  school: { slug: 'fundamentos', name: 'Fundamentos digitales y programación' },
  level: 'Beginner',
  status: 'InDevelopment',
  estimatedMinutes: null,
  technologies: [{ slug: 'csharp', name: 'C#' }],
  moduleCount: 8,
  contentComplete: false,
}

const published: CourseListItem = {
  ...csharp,
  slug: 'redes',
  title: 'Redes, DNS, HTTP y TCP/IP',
  status: 'Published',
  estimatedMinutes: 720,
  technologies: [],
  contentComplete: true,
}

const page = (items: CourseListItem[]) => jsonResponse({ items, page: 1, pageSize: 20, totalCount: items.length })

function coursesQuery(fetchMock: ReturnType<typeof mockApi>): URLSearchParams[] {
  return apiCalls(fetchMock)
    .filter((c) => c.startsWith('GET /api/catalog/courses?'))
    .map((c) => new URLSearchParams(c.split('?')[1]))
}

function mockCatalog(items: CourseListItem[]) {
  return mockApi({ 'GET /api/catalog/courses?*': () => page(items) })
}

describe('catálogo', () => {
  it('lista los cursos y distingue los que están en preparación', async () => {
    mockCatalog([csharp, published])

    renderRoute('/cursos')

    expect(await screen.findByRole('link', { name: 'Programar desde cero con C#' })).toHaveAttribute(
      'href',
      '/cursos/programar-desde-cero-con-csharp',
    )
    expect(screen.getByText('2 cursos')).toBeInTheDocument()
    expect(screen.getByText('En preparación')).toBeInTheDocument()
    expect(screen.getByText('Disponible')).toBeInTheDocument()
    expect(screen.getByText('≈ 12 h')).toBeInTheDocument()
  })

  it('aplica los filtros en la URL y en la consulta a la API', async () => {
    const fetchMock = mockCatalog([csharp])

    const { router } = renderRoute('/cursos')
    await screen.findByText('1 curso')

    await userEvent.selectOptions(screen.getByLabelText('Escuela'), 'fundamentos')
    await userEvent.selectOptions(screen.getByLabelText('Nivel'), 'Beginner')

    expect(router.state.location.search).toBe('?escuela=fundamentos&nivel=Beginner')
    const last = coursesQuery(fetchMock).at(-1)!
    expect(last.get('school')).toBe('fundamentos')
    expect(last.get('level')).toBe('Beginner')
    expect(last.get('page')).toBe('1')
  })

  it('muestra en los desplegables los filtros que vienen en la URL', async () => {
    mockCatalog([csharp])

    renderRoute('/cursos?escuela=ciberseguridad&nivel=Beginner')

    expect(await screen.findByDisplayValue('Ciberseguridad defensiva')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Principiante')).toBeInTheDocument()
  })

  it('busca al enviar el formulario', async () => {
    const fetchMock = mockCatalog([csharp])

    const { router } = renderRoute('/cursos')
    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar por nombre o descripción' }), 'lógica')
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }))

    expect(router.state.location.search).toBe('?q=l%C3%B3gica')
    expect(coursesQuery(fetchMock).at(-1)!.get('q')).toBe('lógica')
  })

  it('muestra un estado vacío con la opción de quitar filtros', async () => {
    mockCatalog([])

    renderRoute('/cursos?q=inexistente')

    expect(await screen.findByText('Ningún curso coincide con tu búsqueda')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Quitar filtros' })).toHaveAttribute('href', '/cursos')
  })

  it('muestra un error comprensible si la API falla', async () => {
    mockApi({ 'GET /api/catalog/courses?*': () => jsonResponse({ status: 500 }, 500) })

    renderRoute('/cursos')

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudieron cargar los cursos')
  })
})

const detail: CourseDetail = {
  slug: 'programar-desde-cero-con-csharp',
  title: 'Programar desde cero con C#',
  summary: 'Aprende lógica de programación con C#.',
  descriptionMarkdown: 'Texto con **negrita** y <script>alert("xss")</script> HTML incrustado.',
  school: { slug: 'fundamentos', name: 'Fundamentos digitales y programación' },
  level: 'Beginner',
  status: 'InDevelopment',
  estimatedMinutes: null,
  language: 'es',
  licenseSpdx: 'CC-BY-SA-4.0',
  learningObjectives: ['Escribir programas con `dotnet run`.'],
  prerequisites: ['Ninguna experiencia en programación.'],
  authors: ['Josue Nina Diaz'],
  softwareVersions: ['.NET 10'],
  lastReviewedAt: null,
  technologies: [{ slug: 'csharp', name: 'C#' }],
  modules: [{ title: 'Tu primer programa', summary: 'Ejecutar `dotnet run hola.cs`.', lessons: [] }],
  contentComplete: false,
}

describe('detalle de curso', () => {
  it('muestra objetivos, temario previsto y el aviso de curso en preparación', async () => {
    mockApi({ [`GET /api/catalog/courses/${detail.slug}`]: () => jsonResponse(detail) })

    renderRoute(`/cursos/${detail.slug}`)

    expect(await screen.findByRole('heading', { level: 1, name: detail.title })).toBeInTheDocument()
    expect(screen.getByText('Este curso está en preparación')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Temario previsto' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Módulo 1. Tu primer programa' })).toBeInTheDocument()
    const objectives = screen.getByRole('heading', { name: 'Qué aprenderás' }).parentElement!
    expect(within(objectives).getByText('dotnet run').tagName).toBe('CODE')
    expect(screen.getByText('Josue Nina Diaz')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /inscrib/i })).not.toBeInTheDocument()
  })

  it('renderiza Markdown sin ejecutar HTML incrustado', async () => {
    mockApi({ [`GET /api/catalog/courses/${detail.slug}`]: () => jsonResponse(detail) })

    const { container } = renderRoute(`/cursos/${detail.slug}`)

    expect((await screen.findByText('negrita')).tagName).toBe('STRONG')
    expect(container.querySelector('script')).toBeNull()
  })

  it('muestra «Curso no encontrado» si no existe', async () => {
    mockApi({ 'GET /api/catalog/courses/no-existe': () => jsonResponse({ status: 404 }, 404) })

    renderRoute('/cursos/no-existe')

    expect(await screen.findByRole('heading', { level: 1, name: 'Curso no encontrado' })).toBeInTheDocument()
  })
})

describe('inicio', () => {
  it('muestra las escuelas desde la API con enlaces al catálogo filtrado', async () => {
    mockApi()

    renderRoute('/')

    const link = await screen.findByRole('link', { name: /^Ciberseguridad defensiva/ })
    expect(link).toHaveAttribute('href', '/cursos?escuela=ciberseguridad')
    expect(screen.getByText('1 curso disponible · 8 en preparación')).toBeInTheDocument()
  })
})

describe('formatDuration', () => {
  it.each([
    [null, null],
    [45, '≈ 45 min'],
    [90, '≈ 2 h'],
    [600, '≈ 10 h'],
  ])('%s → %s', (minutes, expected) => {
    expect(formatDuration(minutes)).toBe(expected)
  })
})
