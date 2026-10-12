# ADR 0004: Código bajo AGPL-3.0-or-later con atribución obligatoria al autor original

- **Estado:** aceptada
- **Fecha:** 2026-10-12
- **Sustituye a:** la propuesta inicial de MIT (decisión D1 de la fase 0)

## Contexto

El autor original quiere dos cosas:

1. Que cualquiera que modifique la plataforma y la ponga a disposición de otras personas publique sus cambios.
2. Que siempre conste que él creó el proyecto.

Kunnskap es una aplicación web. Con licencias permisivas (MIT, Apache) o con la GPL clásica, alguien podría modificarla y ofrecerla como servicio sin compartir nunca el código, porque ofrecer un servicio por la red no cuenta como «distribuir».

## Decisión

- El código se publica bajo la **GNU Affero General Public License v3.0 o posterior** (`AGPL-3.0-or-later`). Su sección 13 obliga a ofrecer el código fuente a quienes usan una versión modificada a través de la red.
- Se añade una **condición adicional según la sección 7(b)**, que la propia licencia permite. En todas las copias y versiones modificadas hay que conservar:
  - `NOTICE.md`, con la línea de copyright del autor original;
  - la frase «Kunnskap fue creado originalmente por …» en el pie de página de la interfaz.
- El contenido educativo sigue bajo **CC BY-SA 4.0**, que ya exige atribución y compartir las adaptaciones con la misma licencia.
- Cada instancia desplegada debe enlazar su código fuente (`VITE_SOURCE_URL`) para cumplir la sección 13.

## Límites (lo que la licencia NO consigue)

- **No obliga a publicar las modificaciones privadas.** Quien modifica el código para uso propio, sin distribuirlo ni ofrecerlo a otras personas, no tiene que publicar nada. Ninguna licencia de software libre puede exigirlo.
- La obligación es entregar el código **a quienes reciben o usan la versión modificada**. En la práctica, una plataforma web pública queda cubierta, porque cualquier usuario puede pedir el código.
- Hacer cumplir la licencia depende de que el titular de los derechos la reclame. Este documento no es asesoramiento legal.

## Consecuencias

- Las dependencias deben ser compatibles con la AGPL. Las actuales (MIT, Apache-2.0, BSD y PostgreSQL License) lo son.
- Algunas empresas evitan el software AGPL. Se acepta: el objetivo es que el proyecto siga siendo abierto.
- Las personas que contribuyen conservan los derechos de autor de sus aportaciones. Por eso, cambiar de licencia en el futuro requeriría su consentimiento. No se pide cesión de derechos (CLA).
