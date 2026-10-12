# ADR 0001: Monolito modular en un único proyecto ASP.NET Core

- **Estado:** aceptada
- **Fecha:** 2026-10-12

## Contexto

La plataforma tendrá varios dominios: identidad, catálogo, aprendizaje, evaluaciones, administración y, más adelante, comunidad y tutor de IA. El equipo es pequeño, los colaboradores pueden tener equipos modestos y el alojamiento debe ser barato.

## Decisión

Usar un **único proyecto ASP.NET Core** con una carpeta por módulo (`Modules/<Módulo>`), una sola base de datos PostgreSQL y un solo `DbContext`.

## Alternativas consideradas

- **Microservicios:** suponen más infraestructura, más coste y más complejidad operativa, sin una necesidad demostrada. Se descartan.
- **Un proyecto (.csproj) por módulo y por capa (Clean Architecture):** los límites quedan más estrictos, pero hay muchos más archivos y más ceremonia para quien empieza a contribuir. Se descarta por ahora. Si algún límite empieza a erosionarse, se añadirán pruebas de arquitectura o se extraerá ese módulo a su propio proyecto.

## Consecuencias

- Se ejecuta con un solo `dotnet run` y se despliega como una sola aplicación.
- Los límites entre módulos dependen de la disciplina y de la revisión. Se documentan en [arquitectura.md](../arquitectura.md).
- Si un módulo pesado (por ejemplo, el *runner* de ejercicios de código) necesita aislamiento, se desplegará **aparte**. Ejecutar código de estudiantes nunca formará parte de este proceso.
