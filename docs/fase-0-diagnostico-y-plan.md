# Fase 0 — Diagnóstico, arquitectura y plan

> Documento vivo. Última revisión: 2026-10-12.
> Nombre de la plataforma: **Kunnskap** («conocimiento» en noruego). Es configurable (`Platform:Name`, `VITE_PLATFORM_NAME`); el código usa el espacio de nombres neutro `Academy`.

## 1. Diagnóstico técnico

### Estado del repositorio

- El directorio del proyecto estaba **vacío**: no había código, historial de git ni configuración previa. No hay nada que conservar ni migrar.
- Se inicializó git en la rama `main`.

### Entorno disponible (macOS 27, Apple Silicon)

| Herramienta | Estado | Observaciones |
|---|---|---|
| Node.js | 24.21 | Versión LTS válida para Vite 8. |
| npm | 11.19 | Se usará npm, sin pnpm ni yarn, para que contribuir tenga menos requisitos. |
| .NET SDK | 10.0.401 | Instalado en `~/.dotnet` durante esta fase. **.NET 10 es la LTS vigente**: .NET 8 deja de tener soporte en noviembre de 2026. |
| Docker | 29.x | Funciona. La imagen `postgres:17.11-alpine` ya estaba descargada. |
| PostgreSQL local | no instalado | Se ejecutará en Docker. |
| git / gh | disponibles | Todavía no hay repositorio remoto. |

### Conflictos detectados

- El puerto **5000** está ocupado por macOS (AirPlay Receiver) y el **5433** por otro proyecto local. Por eso:
  - PostgreSQL se publica en `127.0.0.1:5434`.
  - La API escucha en `http://localhost:5080`.
  - El frontend usa `http://localhost:5173` (el puerto por defecto de Vite).

## 2. Arquitectura propuesta y justificación

```
Navegador ──► Frontend (React + Vite, estático) ──/api──► ASP.NET Core API ──► PostgreSQL
                                                              │
                                                              └─► (futuro) proveedor de IA / sandbox de código, vía interfaces
```

### Decisiones principales

| Decisión | Elección | Motivo |
|---|---|---|
| Estilo de backend | **Monolito modular** en un único proyecto ASP.NET Core, con una carpeta por módulo (`Modules/Catalog`, `Modules/Learning`…) | Un solo proceso y una sola base de datos son fáciles de ejecutar en un portátil modesto y baratos de desplegar. Los límites entre módulos se respetan por convención y por pruebas de arquitectura (fase 4). Si un módulo lo necesitara, podría extraerse más adelante. Ver [ADR 0001](adr/0001-monolito-modular.md). |
| API | **Minimal APIs** con grupos de endpoints por módulo, validación integrada de .NET 10 y OpenAPI integrado (`Microsoft.AspNetCore.OpenApi`) | Menos código ceremonial y ninguna dependencia de terceros para validar ni documentar. |
| Autenticación | **ASP.NET Core Identity** con **cookie HttpOnly** en el mismo origen, más un token antiforgery en las peticiones que modifican datos | Evita guardar tokens en `localStorage`, que quedarían expuestos ante un XSS. Identity resuelve el hash de contraseñas, el bloqueo de cuentas y los tokens de confirmación. Ver [ADR 0002](adr/0002-autenticacion-cookies.md). |
| Autorización | **Políticas basadas en permisos** (`content:manage`, `content:publish`, `users:manage`), asignados a roles (`Student`, `Editor`, `Admin`) | Los permisos se comprueban en el servidor. El frontend solo adapta la interfaz. |
| ORM | **EF Core 10 + Npgsql**, con nombres de tablas en `snake_case` (`EFCore.NamingConventions`) | Migraciones versionadas y SQL idiomático para PostgreSQL. |
| Identificadores | `Guid` v7 (`Guid.CreateVersion7()`) internos, más un `slug` único en las URL públicas | Los UUID v7 se ordenan por tiempo, lo que favorece a los índices. Los slugs dan URLs legibles y no exponen la secuencia de inserción. |
| Fechas | `DateTimeOffset` en UTC → `timestamptz`, obtenidas de `TimeProvider` | Una sola zona horaria en la base de datos y fechas fáciles de simular en las pruebas. |
| Contenido educativo | Archivos **Markdown + YAML versionados en `content/`**, importados a la base de datos por un importador idempotente. El panel de administración edita en la base de datos. | Los educadores revisan el contenido mediante pull requests, como el código. La base de datos sigue siendo la fuente que consulta la aplicación. Ver [ADR 0003](adr/0003-contenido-en-repositorio.md). |
| Render de lecciones | Markdown renderizado con `react-markdown` **sin HTML crudo** | Evita XSS aunque un editor pegue HTML malicioso. |
| Frontend | React 19, TypeScript estricto, Vite 8, React Router 8, Tailwind CSS 4, TanStack Query; oxlint (con reglas jsx-a11y) como linter | TanStack Query gestiona la caché, la carga, los errores y los reintentos del estado del servidor, en lugar de reimplementarlo. Tailwind 4 se configura con tokens CSS (`@theme`). oxlint sustituye a ESLint: un solo paquete y mucho más rápido. |
| Tipografía | Pila de fuentes del sistema | No descarga fuentes: funciona bien en conexiones lentas y se lee correctamente en todas las plataformas. |
| Pruebas | xUnit v3 + `WebApplicationFactory` + **Testcontainers (PostgreSQL real)**; Vitest + Testing Library; Playwright y axe en la fase 4 | Las pruebas de integración usan el mismo motor de base de datos que producción. |
| Entorno local | Docker Compose solo para PostgreSQL. La API y el frontend se ejecutan de forma nativa. | Recarga en caliente rápida. También se incluye un perfil de Compose completo para quien no quiera instalar .NET. |
| CI | GitHub Actions: lint, build y pruebas del backend y del frontend | Es gratuito para repositorios públicos. |
| Despliegue (futuro) | Azure App Service (API + frontend estático servido desde el mismo origen) + Azure Database for PostgreSQL Flexible Server | Mismo origen = sin CORS en producción y cookies `SameSite=Strict`. **Tiene coste** (ver riesgos). |

### Lo que se descarta deliberadamente

- Microservicios, Kubernetes y colas de mensajes: no existe una necesidad demostrada.
- Bibliotecas de componentes pesadas (MUI, Chakra): aumentan el tamaño del paquete. Se construirá un conjunto pequeño de componentes propios y accesibles.
- MediatR, AutoMapper y FluentValidation: no aportan lo suficiente para justificar su coste. Se usan llamadas a servicios explícitas, mapeos a mano y validación nativa.

## 3. Árbol de directorios inicial

```
kunnskap_academy/
├── .github/
│   ├── workflows/ci.yml
│   ├── ISSUE_TEMPLATE/               (fase 1-4)
│   └── pull_request_template.md
├── backend/
│   ├── Academy.slnx
│   ├── src/Academy.Api/
│   │   ├── Program.cs
│   │   ├── Common/                   # errores, seguridad, tiempo, paginación
│   │   ├── Infrastructure/           # DbContext, migraciones, configuración EF
│   │   └── Modules/
│   │       ├── Identity/             # usuarios, roles, permisos, auth
│   │       ├── Catalog/              # escuelas, cursos, módulos, lecciones, rutas
│   │       ├── Learning/             # inscripciones y progreso
│   │       ├── Assessments/          # cuestionarios e intentos
│   │       ├── Administration/       # endpoints de gestión de contenido
│   │       └── Platform/             # salud, configuración pública
│   └── tests/
│       ├── Academy.Api.UnitTests/
│       └── Academy.Api.IntegrationTests/
├── frontend/
│   ├── src/
│   │   ├── app/                      # router, providers, layout
│   │   ├── components/ui/            # botones, campos, estados (sistema de diseño)
│   │   ├── features/                 # catalog, learning, auth, admin…
│   │   ├── lib/                      # cliente HTTP, configuración, i18n
│   │   └── styles/                   # tokens de diseño
│   └── src/**/*.test.tsx         # pruebas junto al código
├── content/                          # cursos en Markdown/YAML (CC BY-SA 4.0)
├── docs/
│   ├── adr/
│   ├── arquitectura.md
│   ├── desarrollo-local.md
│   └── seguridad/
├── docker-compose.yml
├── .env.example
├── LICENSE                           # código
├── LICENSE-CONTENT.md                # contenido educativo
├── README.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
└── SECURITY.md
```

## 4. Modelos de dominio principales

### Identity

- **User** (extiende `IdentityUser<Guid>`): `DisplayName`, `PreferredLanguage`, `CreatedAt`, `DeletedAt?` (borrado lógico y anonimización a petición del usuario).
- **Role**: `Student`, `Editor`, `Admin`. Los **permisos** se definen en el código como constantes y se asignan a los roles mediante claims de rol. No dependen de la base de datos, para que se puedan revisar en los pull requests.

### Catalog

- **School**: `Slug`, `Name`, `Description`, `SortOrder`.
- **Course**: `Slug`, `SchoolId`, `Title`, `Summary`, `Description`, `Level` (Beginner/Intermediate/Advanced), `EstimatedMinutes`, `Status` (Draft, InDevelopment, Published, Archived), `Language`, `LicenseSpdx`, `Authors`, `SoftwareVersions`, `LastReviewedAt`, `PublishedAt`, `Version` (concurrencia optimista).
  - **LearningObjective** (lista ordenada de texto, medible).
  - **CoursePrerequisite**: la referencia a otro curso o el texto libre.
  - **Technology** (etiqueta) ↔ Course, relación N:M.
  - **GlossaryTerm**, **ExternalReference** (documentación oficial: título, URL y tipo: oficial, tercero u original).
- **Module**: `CourseId`, `Title`, `Summary`, `SortOrder`.
- **Lesson**: `ModuleId`, `Slug`, `Title`, `BodyMarkdown`, `EstimatedMinutes`, `SortOrder`, `VideoUrl?`, `TranscriptMarkdown?`, `PracticeActivityMarkdown`, `CheckCriteriaMarkdown`.
  - **LessonResource**: título, URL o archivo, tipo, tamaño y licencia.
- **LearningPath**: `Slug`, `Title`, `Description`, `EntryLevel`, `Prerequisites`, `CompletionCriteria`, `Status`.
  - **LearningPathCourse** (orden), **PathCompetency**, **PathProject**.
- **Project** (proyecto final de curso o de ruta): enunciado, entregables y **RubricCriterion** (criterio, niveles y peso).

### Learning

- **Enrollment**: `UserId`, `CourseId`, `EnrolledAt`, `CompletedAt?`, `LastLessonId?`, `LastActivityAt`. Restricción única: (`UserId`, `CourseId`).
- **LessonProgress**: `UserId`, `LessonId`, `FirstViewedAt`, `CompletedAt?`. Restricción única: (`UserId`, `LessonId`).
- **PathEnrollment**: `UserId`, `LearningPathId`, `StartedAt`.

### Assessments

- **Quiz**: pertenece a una lección o a un módulo. `Title`, `PassingScorePercent`, `MaxAttempts?`, `RevealAnswersPolicy` (AfterSubmit, AfterPassing, Never), `Status`.
- **Question**: `Type` (SingleChoice, MultipleChoice, ShortAnswer), `Prompt`, `Explanation`, `Points`, `SortOrder`, `AcceptedAnswers` (solo para ShortAnswer, normalizadas).
- **QuestionOption**: `Text`, `IsCorrect`, `Feedback`. **`IsCorrect` nunca se serializa hacia el estudiante antes de enviar el intento.**
- **QuizAttempt**: `UserId`, `QuizId`, `StartedAt`, `SubmittedAt?`, `ScorePercent?`, `Passed?`.
- **AttemptAnswer**: `AttemptId`, `QuestionId`, opciones elegidas o texto, `IsCorrect`, `PointsAwarded`.
- Preparado para el futuro: **CodeExercise**, que se ejecutará en un *runner* aislado fuera del proceso de la API y se comunicará mediante una cola o HTTP. Nunca se ejecutará dentro del proceso de la API.

### Cohorts (ediciones impartidas por un instructor)

El curso se puede seguir a tu ritmo o dentro de una edición guiada. Las ediciones son opcionales: sin ellas, el curso funciona igual en modo autodidacta.

- **Cohort** (edición): `CourseId`, `Slug`, `Title` (p. ej. «Edición enero 2027»), `StartsOn`, `EndsOn`, `EnrollmentOpensAt`, `EnrollmentClosesAt`, `Capacity?`, `Status` (Draft, Open, InProgress, Finished), `TimeZone` (zona IANA en la que se anuncian los horarios).
- **CohortInstructor**: `CohortId`, `UserId`. Puede haber más de una persona instructora o mentora.
- **CohortMembership**: `CohortId`, `UserId`, `JoinedAt`. Restricción única: (`CohortId`, `UserId`). Implica una `Enrollment` en el curso.
- **LiveSession**: `CohortId`, `Title`, `StartsAt` (UTC), `DurationMinutes` (≤ 60 por el límite de Teams gratuito), `MeetingUrl` (Teams; visible solo para miembros de la edición), `RecordingUrl?`, `TranscriptMarkdown?`, `RelatedLessonIds`. Las sesiones grabadas deben tener subtítulos.
- **CohortAnnouncement**: `CohortId`, `AuthorId`, `Title`, `BodyMarkdown`, `PublishedAt`.
- Rol nuevo **Instructor** con permiso `cohorts:manage`. Solo puede gestionar las ediciones donde está asignado (autorización basada en recurso, comprobada en el servidor). Ve el progreso de su edición, pero **no** el correo de los alumnos salvo consentimiento.

### Transversales

- **AuditLog**: actor, acción, entidad, id, fecha y datos sin información sensible. Registra las acciones de administración, como publicar o despublicar contenido o cambiar roles.
- Futuro: **PortfolioProject**, **Community** (Question, Answer, Report) y **Certificate**.

## 5. Esquema inicial de base de datos (PostgreSQL)

Fragmento representativo. El esquema real lo generan las migraciones de EF Core.

```sql
CREATE TABLE schools (
  id uuid PRIMARY KEY,
  slug varchar(80) NOT NULL UNIQUE,
  name varchar(160) NOT NULL,
  description text NOT NULL,
  sort_order int NOT NULL DEFAULT 0
);

CREATE TABLE courses (
  id uuid PRIMARY KEY,
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE RESTRICT,
  slug varchar(120) NOT NULL UNIQUE,
  title varchar(200) NOT NULL,
  summary varchar(500) NOT NULL,
  description text NOT NULL,
  level varchar(20) NOT NULL CHECK (level IN ('Beginner','Intermediate','Advanced')),
  status varchar(20) NOT NULL CHECK (status IN ('Draft','InDevelopment','Published','Archived')),
  estimated_minutes int NOT NULL CHECK (estimated_minutes > 0),
  language varchar(10) NOT NULL DEFAULT 'es',
  license_spdx varchar(40) NOT NULL DEFAULT 'CC-BY-SA-4.0',
  last_reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  xmin -- concurrencia optimista (columna de sistema)
);
CREATE INDEX ix_courses_status_school ON courses (status, school_id);       -- filtros del catálogo
-- búsqueda: índice GIN sobre to_tsvector('spanish', title || ' ' || summary), en la fase 2

CREATE TABLE modules (
  id uuid PRIMARY KEY,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title varchar(200) NOT NULL,
  sort_order int NOT NULL,
  UNIQUE (course_id, sort_order)
);

CREATE TABLE lessons (
  id uuid PRIMARY KEY,
  module_id uuid NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  slug varchar(120) NOT NULL,
  title varchar(200) NOT NULL,
  body_markdown text NOT NULL,
  sort_order int NOT NULL,
  estimated_minutes int NOT NULL CHECK (estimated_minutes > 0),
  UNIQUE (module_id, sort_order)
);

CREATE TABLE enrollments (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
  enrolled_at timestamptz NOT NULL,
  completed_at timestamptz,
  last_lesson_id uuid REFERENCES lessons(id) ON DELETE SET NULL,
  last_activity_at timestamptz NOT NULL,
  UNIQUE (user_id, course_id)
);

CREATE TABLE lesson_progress (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  first_viewed_at timestamptz NOT NULL,
  completed_at timestamptz,
  PRIMARY KEY (user_id, lesson_id)
);

CREATE TABLE quiz_attempts (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE RESTRICT,
  started_at timestamptz NOT NULL,
  submitted_at timestamptz,
  score_percent numeric(5,2) CHECK (score_percent BETWEEN 0 AND 100),
  passed boolean
);
CREATE INDEX ix_quiz_attempts_user_quiz ON quiz_attempts (user_id, quiz_id, started_at DESC); -- historial
```

Las tablas de Identity (`users`, `roles`, `user_roles`, `user_claims`…) se generan con el esquema estándar de ASP.NET Core Identity.

## 6. Riesgos técnicos y de seguridad

| # | Riesgo | Impacto | Mitigación |
|---|---|---|---|
| R1 | **Alcance muy amplio** (36 cursos, 5 escuelas, tutor de IA y comunidad) | Muy alto | Se lanza con una sola ruta completa y revisada. El resto del catálogo se marca como `InDevelopment` y se publica progresivamente. |
| R2 | **Calidad y exactitud del contenido**: el contenido redactado con ayuda de IA puede contener errores | Alto | Cada lección enlaza documentación oficial, tiene un responsable de revisión humana y una fecha `last_reviewed_at`. Ningún curso se publica sin esa revisión. |
| R3 | **XSS mediante contenido Markdown** creado por editores o, en el futuro, por la comunidad | Alto | Se renderiza sin HTML crudo, con una CSP estricta y sin `dangerouslySetInnerHTML`. |
| R4 | **Ejecución de código de estudiantes** (en el futuro) | Crítico | Solo en un runner aislado, sin red, con límites de CPU, memoria y tiempo y con un usuario sin privilegios. Nunca dentro del proceso de la API. Antes de implementarlo se redactará un ADR específico. |
| R5 | **Coste de alojamiento en Azure**: PostgreSQL Flexible Server y App Service no son gratuitos de forma indefinida | Medio | El desarrollo local no tiene coste. Antes del lanzamiento se estudiarán Azure for Students, los créditos para organizaciones sin ánimo de lucro y alternativas. El coste mensual estimado se documentará antes de desplegar. |
| R6 | **Coste y fiabilidad de la IA** del tutor | Medio | Será un módulo opcional, detrás de una interfaz, con límites por usuario y por día. La plataforma funcionará por completo sin IA. |
| R7 | **Privacidad y menores de edad**: el público incluye jóvenes | Alto | Se recogerán los datos mínimos (correo y nombre visible), habrá una edad mínima declarada en los términos, exportación y borrado de cuenta, y no se usarán analíticas de terceros. Antes del lanzamiento se necesitará una **revisión legal** (RGPD o la ley del país de operación). |
| R8 | **Abuso en el registro y en el inicio de sesión** | Medio | Limitación de solicitudes con `RateLimiter` en los endpoints de autenticación, bloqueo de cuenta de Identity y confirmación del correo (cuando exista un servicio de correo). |
| R9 | **CSRF con autenticación por cookies** | Medio | Cookies `SameSite=Strict` y `HttpOnly`, más un token antiforgery en una cabecera en las peticiones que modifican datos. |
| R10 | **Dependencia de un único mantenedor** | Alto | Documentación de instalación en menos de 15 minutos, issues para principiantes, ADRs y CI que protege la rama `main`. |
| R11 | **Licencias**: es difícil cambiarlas cuando ya hay contribuciones externas | Medio | Debe decidirse **antes** de aceptar el primer pull request externo (ver la decisión pendiente D1). |
| R12 | **Afirmaciones engañosas** (acreditación, empleo, MVP) | Medio | Habrá un texto legal claro: no es una institución acreditada y los certificados no equivalen a títulos. Se revisará el texto de la página de inicio. |

### Decisiones pendientes que serán difíciles de cambiar

- **D1 — Licencias. Decidida (2026-10-12):** el código se publica bajo **AGPL-3.0-or-later**, con una condición adicional de atribución al autor original según la sección 7(b), y el contenido bajo **CC BY-SA 4.0**. Ver [ADR 0004](adr/0004-licencia-agpl.md).
- **D2 — Contenido en el repositorio frente a contenido solo en la base de datos.** La propuesta es mantener el contenido como archivos versionados en `content/` (ADR 0003).
- **D3 — Nombre y dominio.** Nombre elegido: **Kunnskap**. Falta decidir el dominio. El nombre vive solo en la configuración (`Platform:Name`, `VITE_PLATFORM_NAME`).
- **D4 — Idiomas.** Cada curso tiene un campo `language`, y las traducciones serán cursos distintos enlazados entre sí. Así se evitan tablas de traducción complejas.
- **D6 — Modalidad de enseñanza. Decidida (2026-10-12):** ediciones en vivo impartidas por Josue Nina Diaz más lecciones escritas que permiten seguir el curso a tu ritmo. Sesiones en **Microsoft Teams** (versión gratuita: reuniones de hasta 60 minutos y 100 participantes, según fuentes no oficiales que hay que confirmar). Se graban con OBS y se publican en YouTube con subtítulos, porque la grabación del plan gratuito no está garantizada.
- **D7 — Primer curso. Decidido (2026-10-12):** **«Programar desde cero con C#»**. Enseña lógica de programación directamente en C# con .NET 10 y aplicaciones de un solo archivo (`dotnet run hola.cs`, comprobado en local), sin `.csproj` ni ceremonia inicial. Sustituye a los cursos genéricos 1 y 2 de la Escuela 1 como puerta de entrada. Git y GitHub (curso 3) se mantienen.
- **D5 — Proveedor de correo** para la confirmación de cuentas y la recuperación de contraseñas. En desarrollo los correos se escriben en el log, y la integración queda pendiente.

## 7. Plan de implementación priorizado

### Fase 1 — Fundamentos ejecutables (en curso)

1. Archivos base del repositorio: `.gitignore`, `.editorconfig`, licencias, README, CONTRIBUTING, CODE_OF_CONDUCT y SECURITY.
2. Backend: solución .NET 10, endpoint de salud, configuración pública, ProblemDetails, cabeceras de seguridad, CORS por entorno y OpenAPI.
3. PostgreSQL en Docker Compose, `DbContext` con Identity y el esquema base del catálogo, y la migración inicial.
4. Pruebas del backend: unitarias y de integración con Testcontainers.
5. Frontend: Vite, React, TypeScript estricto, Tailwind (tokens), Router, el layout base accesible, la página de inicio sin datos inventados y la página de estado de la API.
6. Pruebas del frontend con Vitest y Testing Library, y oxlint con reglas de accesibilidad (`jsx-a11y`).
7. CI con GitHub Actions.
8. Guía de desarrollo local y la guía de arquitectura.

### Fase 2 — Primer recorrido educativo

0. ✅ Preparación: .NET Aspire para orquestar el entorno local, Dev Container y GitHub Codespaces (aprender y contribuir sin instalar nada), y publicación del repositorio.
1. ✅ Registro, inicio y cierre de sesión con cookie y antiforgery, limitación de solicitudes y roles (Student, Instructor, Editor y Admin). *(2026-10-12)*
2. ✅ Catálogo desde la base de datos, con búsqueda sin tildes, filtros, paginación y contenido importado desde `content/`. *(2026-10-12)*
3. ✅ Inscripción gratuita. *(2026-10-12)*
4. ✅ Lección con Markdown seguro, pública y sin necesidad de cuenta, con navegación entre lecciones. *(2026-10-12)*
5. ✅ Progreso, lecciones completadas y punto desde el que continuar. *(2026-10-12)*
6. Cuestionario con intentos.
7. Panel del estudiante.
8. **Ediciones y sesiones en vivo:** crear una edición, unirse, ver el calendario en la zona horaria del alumno, enlace a Teams solo para miembros, grabación y transcripción.
9. Administración del contenido.

Cada punto se entrega como un pull request pequeño, con sus pruebas.

### Fase 3 — Primera ruta curricular

La ruta «Programación desde cero»: el curso **«Programar desde cero con C#»**, impartido en una primera edición en vivo, más «Alfabetización digital» y «Git y GitHub», revisados y con un proyecto final y su rúbrica. Los ejercicios se pueden hacer en GitHub Codespaces desde el navegador. Las demás escuelas aparecen como `InDevelopment` en el catálogo.

### Fase 4 y Fase 5

Siguen el orden del documento maestro.

## 8. Criterios de aceptación de la Fase 1

- [x] `docker compose up -d db` levanta PostgreSQL 17 en `127.0.0.1:5434`.
- [x] `dotnet ef database update` (o el arranque de la API en desarrollo) crea el esquema mediante migraciones.
- [x] `dotnet run` inicia la API en `http://localhost:5080`. `/api/health` responde `200` cuando hay conexión con la base de datos y `503` cuando no la hay.
- [x] El documento OpenAPI está disponible en desarrollo en `/openapi/v1.json`.
- [x] Los errores no controlados devuelven `application/problem+json` sin trazas internas.
- [x] Las respuestas incluyen cabeceras de seguridad: `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` y `Content-Security-Policy` en la API.
- [x] `npm run dev` sirve el frontend, que muestra el nombre de la plataforma desde la configuración y el estado de la API.
- [x] `dotnet test` pasa, incluida al menos una prueba de integración contra PostgreSQL real.
- [x] `npm run lint`, `npm run typecheck`, `npm test` y `npm run build` pasan.
- [x] El flujo de CI se ha definido para backend y frontend. *(No se ha ejecutado todavía en GitHub: el repositorio aún no tiene remoto.)*
- [x] No hay secretos en el repositorio: solo `.env.example` y `appsettings.Development.json` con credenciales locales evidentes de desarrollo.
- [x] La guía `docs/desarrollo-local.md` permite arrancar el proyecto desde cero.

Verificado en local el 2026-10-12. La comprobación visual en navegador y móvil queda pendiente para la fase 2, junto con Playwright.
