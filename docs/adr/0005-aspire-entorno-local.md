# ADR 0005: .NET Aspire para el entorno local y OpenTelemetry en la API

- **Estado:** aceptada
- **Fecha:** 2026-10-12

## Contexto

Antes de esta decisión, arrancar el proyecto exigía tres terminales: PostgreSQL con Compose, la API y Vite. Kunnskap busca que cualquier persona pueda contribuir o seguir los cursos con el menor esfuerzo posible, incluso desde el navegador. Además, la observabilidad es tema del curso 18 y conviene que la plataforma sirva de ejemplo real.

## Decisión

- Añadir un **AppHost de Aspire 13** que orquesta PostgreSQL 17 (contenedor con volumen persistente y contraseña generada), la API y el frontend de Vite con un solo comando.
- Añadir **ServiceDefaults**: OpenTelemetry (trazas, métricas y logs), health checks, service discovery y resiliencia. La API también traza las consultas SQL con `Npgsql.OpenTelemetry`.
- Añadir un **Dev Container** (`.devcontainer/`) compatible con GitHub Codespaces, con .NET 10, Node 24 y Docker-in-Docker.
- **Mantener Docker Compose** como alternativa.

## Alternativas consideradas

- **Solo Docker Compose (API y web incluidas):** recompilar dentro de contenedores es lento y no ofrece un panel de observabilidad.
- **Tye u otras herramientas de orquestación:** están abandonadas o son menos integradas.

## Consecuencias

- El AppHost y ServiceDefaults suman dos proyectos. Las dependencias son de Microsoft o de OpenTelemetry, con licencias MIT o Apache-2.0, compatibles con la AGPL.
- La CI compila también el AppHost, pero las pruebas no dependen de Aspire: siguen usando Testcontainers.
- El bundle de la CLI de Aspire, que instala y marca como de confianza el certificado de desarrollo de `localhost` sin preguntar, está desactivado (`AspireUseCliBundle=false`). El perfil por defecto es `http`, y la guía explica cómo eliminar el certificado si ya se instaló.
- La construcción del Dev Container se verifica en GitHub Actions (`.github/workflows/devcontainer.yml`). En local no se pudo verificar en Apple Silicon: el mirror de Ubuntu para ARM respondió 403 desde la red de desarrollo.
