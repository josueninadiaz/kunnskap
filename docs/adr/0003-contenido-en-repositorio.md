# ADR 0003: Contenido educativo versionado en el repositorio e importado a la base de datos

- **Estado:** propuesta (se confirmará en la fase 3)
- **Fecha:** 2026-10-12

## Contexto

Los cursos deben salir de la base de datos, no de tarjetas escritas a mano en el frontend. Al mismo tiempo, el contenido necesita revisión técnica, historial de cambios, autoría clara y licencia. Además, educadores externos deben poder proponer mejoras.

## Decisión

- El contenido curricular oficial se escribe como **Markdown con metadatos YAML** en `content/<escuela>/<curso>/…`.
- Un **importador idempotente** (un comando de la API) valida ese contenido y lo sincroniza con PostgreSQL, usando el `slug` como clave estable.
- La aplicación **siempre lee de la base de datos**.
- El panel de administración permite crear y editar borradores directamente en la base de datos. Para el contenido de `content/`, el importador es la fuente de verdad y el panel lo indica.

## Alternativas consideradas

- **Solo base de datos (CMS interno):** es más sencillo de implementar, pero se pierden la revisión mediante pull requests y el historial de git, y es más difícil que otros reutilicen el contenido bajo CC BY-SA.
- **Solo archivos, sin base de datos:** la búsqueda, el progreso y las relaciones se complican.

## Consecuencias

- Hace falta definir un esquema de metadatos y validarlo en la CI.
- Hay que resolver los conflictos entre ediciones hechas en el panel y el contenido del repositorio. La regla inicial es que el repositorio prevalece, y el panel muestra esos cursos como «gestionados desde el repositorio».
