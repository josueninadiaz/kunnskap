import { Search } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Button } from '../../components/ui/Button'
import { PageHeader } from '../../components/ui/PageHeader'
import { SelectField } from '../../components/ui/SelectField'
import { StatusMessage } from '../../components/ui/StatusMessage'
import { describeError } from '../../lib/api'
import {
  type CatalogFilters,
  durationLabels,
  levelLabels,
  PAGE_SIZE,
  useCatalogFacets,
  useCourses,
} from './catalogApi'
import { CourseFacts, CourseStatusBadge } from './CourseMeta'

// Parámetros de la URL en español (lo que ve la persona) ↔ filtros de la API.
const urlKeys = { q: 'q', school: 'escuela', level: 'nivel', technology: 'tecnologia', duration: 'duracion', page: 'pagina' } as const

function readFilters(params: URLSearchParams): CatalogFilters {
  const page = Number(params.get(urlKeys.page))
  return {
    q: params.get(urlKeys.q) ?? '',
    school: params.get(urlKeys.school) ?? '',
    level: params.get(urlKeys.level) ?? '',
    technology: params.get(urlKeys.technology) ?? '',
    duration: params.get(urlKeys.duration) ?? '',
    page: Number.isInteger(page) && page > 0 ? page : 1,
  }
}

function writeFilters(filters: CatalogFilters): URLSearchParams {
  const params = new URLSearchParams()
  for (const key of ['q', 'school', 'level', 'technology', 'duration'] as const) {
    const value = filters[key].trim()
    if (value) params.set(urlKeys[key], value)
  }
  if (filters.page > 1) params.set(urlKeys.page, String(filters.page))
  return params
}

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = readFilters(searchParams)
  const facets = useCatalogFacets()
  const courses = useCourses(filters)
  const update = (changes: Partial<CatalogFilters>) =>
    setSearchParams(writeFilters({ ...filters, page: 1, ...changes }))

  const hasFilters = Boolean(filters.q || filters.school || filters.level || filters.technology || filters.duration)
  const totalPages = courses.data ? Math.max(1, Math.ceil(courses.data.totalCount / PAGE_SIZE)) : 1

  return (
    <section>
      <PageHeader
        title="Cursos"
        description="Todos los cursos son gratuitos. Los marcados como «En preparación» todavía no admiten inscripciones."
      />

      <div className="space-y-4 rounded-[1.5rem] border border-border bg-surface p-4 shadow-soft sm:p-6">
        {/* La key reinicia el cuadro cuando la URL cambia (p. ej. al volver atrás). */}
        <SearchBox key={filters.q} initialQuery={filters.q} onSearch={(q) => update({ q })} />

        {/*
          La key remonta los desplegables cuando llegan las opciones: los navegadores no vuelven a
          seleccionar el valor de un <select> controlado si sus opciones aparecen después.
        */}
        <div key={facets.isSuccess ? 'con-opciones' : 'cargando'} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SelectField
            label="Escuela"
            emptyLabel="Todas"
            value={filters.school}
            onChange={(e) => update({ school: e.target.value })}
            options={(facets.data?.schools ?? []).map((s) => ({ value: s.slug, label: s.name }))}
          />
          <SelectField
            label="Nivel"
            emptyLabel="Todos"
            value={filters.level}
            onChange={(e) => update({ level: e.target.value })}
            options={(facets.data?.levels ?? []).map((l) => ({ value: l, label: levelLabels[l] }))}
          />
          <SelectField
            label="Tecnología"
            emptyLabel="Todas"
            value={filters.technology}
            onChange={(e) => update({ technology: e.target.value })}
            options={(facets.data?.technologies ?? []).map((t) => ({ value: t.slug, label: t.name }))}
          />
          <SelectField
            label="Duración"
            emptyLabel="Cualquiera"
            value={filters.duration}
            onChange={(e) => update({ duration: e.target.value })}
            options={Object.entries(durationLabels).map(([value, label]) => ({ value, label }))}
          />
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p aria-live="polite" className="text-sm text-fg-muted">
            {courses.data
              ? courses.data.totalCount === 1
                ? '1 curso'
                : `${courses.data.totalCount} cursos`
              : null}
          </p>
          {hasFilters ? (
            <Link to="/cursos" className="text-sm font-medium text-accent underline">
              Quitar filtros
            </Link>
          ) : null}
        </div>

        {courses.isPending ? <StatusMessage tone="loading" title="Cargando cursos…" /> : null}

        {courses.isError ? (
          <StatusMessage
            tone="error"
            title="No se pudieron cargar los cursos"
            action={
              <Button variant="secondary" onClick={() => void courses.refetch()}>
                Reintentar
              </Button>
            }
          >
            {describeError(courses.error)}
          </StatusMessage>
        ) : null}

        {courses.data && courses.data.items.length === 0 ? (
          <StatusMessage tone="info" title="Ningún curso coincide con tu búsqueda">
            Prueba con otras palabras o quita algún filtro.
          </StatusMessage>
        ) : null}

        {courses.data && courses.data.items.length > 0 ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.data.items.map((course) => (
              <li
                key={course.slug}
                className="group relative flex flex-col gap-3 rounded-(--radius-panel) border border-border bg-surface p-6 transition-colors hover:border-border-strong"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="eyebrow text-fg-muted">{course.school.name}</span>
                  <CourseStatusBadge status={course.status} />
                </div>
                <h2 className="text-[1.375rem] leading-tight font-semibold tracking-[-0.022em]">
                  {/* El enlace cubre toda la tarjeta (after:absolute), pero su nombre accesible es el título. */}
                  <Link
                    to={`/cursos/${course.slug}`}
                    className="after:absolute after:inset-0 after:rounded-(--radius-panel) group-hover:text-accent"
                  >
                    {course.title}
                  </Link>
                </h2>
                <p className="line-clamp-3 text-[0.9375rem] text-fg-muted">{course.summary}</p>
                <div className="mt-auto space-y-3 pt-2">
                  <CourseFacts
                    level={course.level}
                    estimatedMinutes={course.estimatedMinutes}
                    partial={course.status === 'Published' && !course.contentComplete}
                  />
                  {course.technologies.length > 0 ? (
                    <ul className="flex flex-wrap gap-1.5" aria-label="Tecnologías">
                      {course.technologies.map((t) => (
                        <li key={t.slug} className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-medium">
                          {t.name}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : null}

        {courses.data && totalPages > 1 ? (
          <nav aria-label="Paginación" className="flex items-center justify-between gap-4">
            {filters.page > 1 ? (
              <Link to={`/cursos?${writeFilters({ ...filters, page: filters.page - 1 }).toString()}`} className="font-medium text-accent underline">
                Anterior
              </Link>
            ) : (
              <span />
            )}
            <span className="text-sm text-fg-muted">
              Página {filters.page} de {totalPages}
            </span>
            {filters.page < totalPages ? (
              <Link to={`/cursos?${writeFilters({ ...filters, page: filters.page + 1 }).toString()}`} className="font-medium text-accent underline">
                Siguiente
              </Link>
            ) : (
              <span />
            )}
          </nav>
        ) : null}
      </div>
    </section>
  )
}

function SearchBox({ initialQuery, onSearch }: { initialQuery: string; onSearch: (query: string) => void }) {
  const [query, setQuery] = useState(initialQuery)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSearch(query)
  }

  return (
    <search>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <label htmlFor="buscar-cursos" className="block text-sm font-medium">
            Buscar por nombre o descripción
          </label>
          <input
            id="buscar-cursos"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Por ejemplo: lógica, React, redes…"
            className="block min-h-12 w-full rounded-full border border-border-strong bg-surface px-5 py-2 text-base text-fg placeholder:text-fg-muted"
          />
        </div>
        <Button type="submit" size="lg">
          <Search aria-hidden="true" className="size-4" />
          Buscar
        </Button>
      </form>
    </search>
  )
}
