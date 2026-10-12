# Arquitectura

Visión general para quien llega al proyecto. Las decisiones importantes y sus alternativas están en los [ADR](adr/). El diagnóstico inicial y el plan por fases están en [fase-0-diagnostico-y-plan.md](fase-0-diagnostico-y-plan.md).

## Vista general

```
Navegador
   │  HTML/JS estático + llamadas a /api (mismo origen, cookies HttpOnly)
   ▼
Frontend (React + Vite)          ──/api──►   API ASP.NET Core (.NET 10)   ──►   PostgreSQL 17
  features/ por área funcional                 Modules/ por dominio
  components/ui (sistema de diseño)            Common/ (errores, seguridad, persistencia)
```

## Backend: monolito modular

Todo el backend vive en un solo proyecto, `backend/src/Academy.Api`, organizado así:

| Carpeta | Contenido |
|---|---|
| `Common/` | Piezas transversales: ProblemDetails, cabeceras de seguridad, CORS e interceptor de auditoría |
| `Infrastructure/Persistence/` | `AcademyDbContext`, registro de EF Core y migraciones |
| `Modules/Identity/` | Usuarios, roles y la matriz de permisos (`Permissions.cs`) |
| `Modules/Catalog/` | Escuelas, cursos, módulos, lecciones y tecnologías |
| `Modules/Platform/` | Endpoints de salud y configuración pública |

Cada módulo contiene su dominio (`Domain/`), su configuración de EF (`Persistence/`) y sus endpoints. Los módulos que se añadirán más adelante (`Learning`, `Assessments`, `Administration`…) siguen la misma forma.

**Reglas:**

- Un módulo no modifica directamente las entidades de otro módulo. Si necesita algo de él, usa un servicio expuesto por ese módulo.
- Todas las fechas se guardan en UTC (`DateTimeOffset` → `timestamptz`) y se obtienen de `TimeProvider`.
- Los identificadores internos son UUID v7. Las URL públicas usan `slug`.
- Las reglas de integridad se aplican **también** en la base de datos: `UNIQUE`, `CHECK` y claves foráneas.
- La concurrencia optimista de los cursos usa la columna `xmin` de PostgreSQL.
- Los errores se devuelven como `application/problem+json`, sin detalles internos y con un `traceId`.

## Catálogo

- El contenido curricular vive en `content/` (YAML) y `ContentImporter` lo sincroniza con PostgreSQL usando el slug como clave. Es idempotente y nunca borra cursos (ADR 0003).
- `/api/catalog/*` solo expone cursos `Published` e `InDevelopment`. Los borradores y archivados devuelven 404.
- La búsqueda usa `ILIKE` con `unaccent()`, de modo que «logica» encuentra «Lógica», y escapa los comodines. Con un catálogo de decenas de cursos no necesita índices. Si crece a miles, habrá que añadir un índice trigram (`pg_trgm`).
- En Azure Database for PostgreSQL hay que permitir la extensión `unaccent` (parámetro `azure.extensions`).

## Aprendizaje

- Las lecciones de cursos **publicados** son públicas (`/api/catalog/courses/{curso}/lessons/{lección}`): se pueden leer sin cuenta.
- `Modules/Learning`: `Enrollment` (única por persona y curso) y `LessonProgress` (primera visita y fecha de completado). Los endpoints `/api/learning/courses/{curso}/…` exigen sesión, y guardar progreso exige inscripción.
- Un curso se da por completado cuando lo están todas sus lecciones publicadas. Si se publican lecciones nuevas, vuelve a quedar abierto. Las evaluaciones se sumarán a esta regla.
- Las entidades nuevas con `Guid` generado en el cliente se registran con `Add` explícito: si solo se añaden a una colección de una entidad ya existente, EF Core supone que existen y hace un `UPDATE` (ver `ContentImporter`).

## Seguridad (resumen)

- La autenticación usa ASP.NET Core Identity con la cookie `kunnskap_session` (HttpOnly, `SameSite=Strict` y `Secure` fuera de desarrollo). Los endpoints están en `/api/auth/*`.
- Todo POST, PUT, PATCH o DELETE bajo `/api` exige el token antiforgery (`AntiforgeryFilter`). El frontend lo gestiona en `lib/api.ts` (`apiSend`).
- La autorización se basa en **permisos** (`content:manage`, `content:publish`, `cohorts:manage`, `users:manage`) que se añaden como claims al iniciar sesión (`PermissionClaimsFactory`) y se comprueban en el servidor. Los roles se siembran mediante una migración.
- Los DTO de petición son `public`: el generador de validación de .NET 10 ignora los tipos `internal`.
- Cabeceras de seguridad en todas las respuestas, y CORS cerrado por defecto.
- Ver [seguridad/modelo-de-amenazas.md](seguridad/modelo-de-amenazas.md).

## Frontend

| Carpeta | Contenido |
|---|---|
| `src/app/` | Router, layout, proveedores y páginas de error |
| `src/components/ui/` | Componentes base del sistema de diseño |
| `src/features/<área>/` | Páginas y lógica de cada área (catálogo, aula, panel…) |
| `src/lib/` | Cliente HTTP (`api.ts`) y configuración |
| `src/styles/index.css` | Tokens de diseño (colores semánticos, tipografía y radios) para los modos claro y oscuro |

**Reglas:**

- El estado del servidor se gestiona con TanStack Query. Cada pantalla trata explícitamente los estados de carga, error, vacío y éxito (componente `StatusMessage`).
- No se usa `dangerouslySetInnerHTML`, y el linter lo prohíbe.
- Solo se usan colores semánticos (`bg-accent`, `text-fg-muted`), nunca colores literales, para mantener el contraste en los dos modos.
- No se añaden botones ni enlaces que todavía no hagan nada.

## Entorno local y observabilidad

- `backend/src/Academy.AppHost` (Aspire) orquesta PostgreSQL, la API y Vite. Ver [ADR 0005](adr/0005-aspire-entorno-local.md).
- `backend/src/Academy.ServiceDefaults` añade a la API OpenTelemetry (trazas, métricas y logs), health checks, service discovery y resiliencia de `HttpClient`. Las consultas a PostgreSQL se trazan con `Npgsql.OpenTelemetry`. La telemetría solo se exporta si `OTEL_EXPORTER_OTLP_ENDPOINT` está definido, como ocurre con Aspire o, en el futuro, con Azure Monitor.
- `docker-compose.yml` se mantiene como alternativa sin Aspire.

## Pruebas

| Tipo | Herramienta | Qué cubre |
|---|---|---|
| Unitarias (backend) | xUnit v3 | Lógica pura: matriz de permisos, interceptores… |
| Integración (backend) | xUnit v3 + `WebApplicationFactory` + Testcontainers | La API real contra PostgreSQL real: endpoints, restricciones y concurrencia |
| Componentes y recorridos (frontend) | Vitest + Testing Library | Páginas renderizadas con el router real y `fetch` simulado |
| E2E y accesibilidad | Playwright + axe | Fase 4 |
