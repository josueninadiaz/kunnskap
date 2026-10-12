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
| `estimatedMinutes` | al publicar | Duración estimada. No la inventes: estímala cuando el temario esté escrito |
| `technologies` | no | Lista de `slug` de `tecnologias.yml` |
| `objectives` | al publicar | Objetivos de aprendizaje medibles («Escribir…», «Explicar…») |
| `prerequisites`, `authors`, `softwareVersions` | no | Listas de texto |
| `lastReviewedAt` | al publicar | Fecha de la última revisión técnica (`AAAA-MM-DD`) |
| `modules` | al publicar | Módulos con `title` y `summary`. Las lecciones se añadirán como archivos Markdown |

Un curso solo puede pasar a `Published` si tiene duración, objetivos, fecha de revisión y al menos un módulo con lecciones.
