# Kunnskap

Kunnskap es una plataforma educativa **gratuita y de código abierto** para aprender programación, desarrollo de software, inteligencia artificial y ciberseguridad. Está pensada para quienes no pueden pagar una universidad ni formación privada. *Kunnskap* significa «conocimiento» en noruego.

> **Estado: en construcción (Fase 1, fundamentos).** Todavía no hay cursos publicados. Kunnskap no es una institución acreditada: sus cursos no equivalen a títulos universitarios ni garantizan un empleo.

## Principios

1. **Educación gratuita:** los cursos, ejercicios y materiales esenciales nunca dependen de un pago.
2. **Aprendizaje práctico:** cada ruta termina con un proyecto real.
3. **Accesibilidad:** funciona en móviles, en equipos modestos y con conexiones lentas. El objetivo es WCAG 2.2 AA.
4. **Código abierto y que siga siéndolo:** el código está bajo licencia AGPL-3.0 y el contenido bajo CC BY-SA 4.0. Quien lo modifique y lo publique o lo ofrezca como servicio debe compartir su código y mantener la atribución al autor original.
5. **Comunidad:** enseñanza, mentoría y colaboración.

## Tecnología

| Parte | Tecnologías |
|---|---|
| Frontend | React 19, TypeScript (estricto), Vite, React Router, Tailwind CSS 4, TanStack Query |
| Backend | C# / ASP.NET Core (.NET 10 LTS), Minimal APIs, EF Core, ASP.NET Core Identity, OpenTelemetry |
| Entorno local | .NET Aspire, Dev Container / GitHub Codespaces, Docker Compose |
| Base de datos | PostgreSQL 17 con migraciones de EF Core |
| Pruebas | xUnit v3 con Testcontainers (PostgreSQL real), Vitest y Testing Library |
| CI | GitHub Actions |

Los motivos de cada decisión están en [docs/arquitectura.md](docs/arquitectura.md) y en [docs/adr/](docs/adr/).

## Empezar en 5 minutos

**Sin instalar nada:** abre el repositorio en GitHub Codespaces (*Code → Codespaces → Create codespace on main*) y ejecuta `dotnet run --project backend/src/Academy.AppHost`.

**En tu equipo:** necesitas [Docker](https://docs.docker.com/get-docker/), el [SDK de .NET 10](https://dotnet.microsoft.com/download/dotnet/10.0) y [Node.js 24 LTS](https://nodejs.org/).

```bash
cd frontend && npm install && cd ..
dotnet run --project backend/src/Academy.AppHost   # PostgreSQL + API + web, con el panel de Aspire
```

También puedes levantar cada pieza por separado con Docker Compose. La guía completa, con la solución de problemas, está en [docs/desarrollo-local.md](docs/desarrollo-local.md).

## Estructura

```
backend/    API ASP.NET Core (monolito modular) y sus pruebas
frontend/   Aplicación web React
content/    Contenido educativo versionado (próximamente)
docs/       Arquitectura, ADR, seguridad y guías
```

## Contribuir

Lee [CONTRIBUTING.md](CONTRIBUTING.md) y el [Código de conducta](CODE_OF_CONDUCT.md). Para informar de una vulnerabilidad, sigue las instrucciones de [SECURITY.md](SECURITY.md).

## Licencias

- Código: [GNU AGPL-3.0 o posterior](LICENSE), con la condición adicional de atribución descrita en [NOTICE.md](NOTICE.md).
- Autoría original: ver [NOTICE.md](NOTICE.md).
- Contenido educativo: [CC BY-SA 4.0](LICENSE-CONTENT.md).
