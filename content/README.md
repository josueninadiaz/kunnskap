# Contenido educativo

Esta carpeta es la **fuente del catálogo**. La API la importa a PostgreSQL con:

```bash
dotnet run --project backend/src/Academy.Api -- content import
```

En desarrollo, la importación se ejecuta automáticamente al arrancar. Las pruebas de la CI validan todos estos archivos, así que un pull request con contenido mal formado no se puede fusionar.

Licencia: [CC BY-SA 4.0](../LICENSE-CONTENT.md).

## Estructura

```
content/
├── escuelas.yml                  # escuelas (áreas) del catálogo
├── tecnologias.yml               # etiquetas de tecnología usadas en los filtros
└── cursos/<escuela>/<curso>/curso.yml
```

## Campos de `curso.yml`

| Campo | Obligatorio | Descripción |
|---|---|---|
| `slug` | sí | Identificador de la URL: minúsculas, números y guiones. **No cambiarlo después de publicar.** |
| `school` | sí | `slug` de la escuela |
| `order` | sí | Posición dentro de la escuela |
| `title`, `summary` | sí | Título (≤ 200 caracteres) y resumen de una o dos frases (≤ 500) |
| `description` | no | Descripción en Markdown. Si falta, se usa el resumen |
| `level` | sí | `Beginner`, `Intermediate` o `Advanced` |
| `status` | sí | `Draft` (oculto), `InDevelopment` (visible como «en preparación») o `Published` |
| `estimatedMinutes` | no | Duración estimada del curso completo. Si falta, al publicar se usa la suma de las lecciones publicadas |
| `technologies` | no | Lista de `slug` de `tecnologias.yml` |
| `objectives` | al publicar | Objetivos de aprendizaje medibles («Escribir…», «Explicar…») |
| `prerequisites`, `authors`, `softwareVersions` | no | Listas de texto |
| `lastReviewedAt` | al publicar | Fecha de la última revisión técnica (`AAAA-MM-DD`) |
| `modules` | al publicar | Módulos con `title`, `summary` y, opcionalmente, `lessons` (carpeta de lecciones) |

## Lecciones

Cada módulo puede indicar `lessons: <carpeta>`. Esa carpeta contiene una lección por archivo `.md`, ordenadas por nombre (`01-…`, `02-…`):

```markdown
---
slug: tu-primer-programa
title: Tu primer programa
estimatedMinutes: 20
videoUrl: https://…   # opcional; si existe, se exige «## Transcripción»
---
Explicación con ejemplos…

## Actividad práctica
…

## Comprueba lo aprendido
…
```

- Se usa Markdown estándar ([CommonMark](https://commonmark.org/help/)): encabezados `###` dentro de la explicación, listas, enlaces, negrita y bloques de código con lenguaje (```` ```csharp ````). **No se admiten tablas ni HTML** (el HTML se descarta al mostrar la lección).
- Todo el código de ejemplo debe haberse ejecutado. Cuando muestres una salida o un mensaje de error, copia el real.
- Enlaza documentación oficial en una sección «Referencias» al final de la explicación.

## Cuestionarios

Cada módulo puede indicar `quiz: <archivo>.yml` (relativo a la carpeta del curso):

```yaml
slug: cuestionario-tu-primer-programa      # único en toda la plataforma
title: Comprueba lo que aprendiste en el módulo 1
passingScore: 70                           # porcentaje para aprobar
questions:
  - id: sdk-o-runtime                      # clave estable: no la cambies o se pierde el historial
    type: single                           # single, multiple o short
    prompt: ¿Qué tienes que instalar…?
    options:
      - { text: El SDK de .NET., correct: true }
      - { text: Solo el Runtime de .NET. }
    explanation: Se muestra al acertar y, al aprobar, en todas las preguntas.
    hint: Se muestra al fallar. Orienta sin dar la respuesta.
    lesson: prepara-tu-entorno             # lección para repasar
```

- `single`: al menos 2 opciones y exactamente 1 correcta. `multiple`: se acierta marcando exactamente las correctas. `short`: lista `answers`; se compara sin distinguir mayúsculas, tildes ni espacios sobrantes. Úsala solo cuando la respuesta sea inequívoca (un comando, un código de error).
- Las respuestas correctas nunca llegan al navegador antes de aprobar.

Un curso solo puede pasar a `Published` si tiene objetivos, fecha de revisión **humana** (`lastReviewedAt`) y al menos un módulo con lecciones. Puede publicarse con módulos aún sin lecciones: el temario los mostrará «en preparación».
