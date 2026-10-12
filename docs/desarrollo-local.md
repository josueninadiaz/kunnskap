# Desarrollo local

Esta guía explica cómo ejecutar Kunnskap en tu equipo partiendo de cero. No necesitas cuentas de pago ni acceso a servicios privados.

## 1. Requisitos

| Herramienta | Versión | Para qué |
|---|---|---|
| [Docker](https://docs.docker.com/get-docker/) (Docker Desktop, Colima u OrbStack) | reciente | Ejecutar PostgreSQL y las pruebas de integración |
| [SDK de .NET 10](https://dotnet.microsoft.com/download/dotnet/10.0) | 10.0.100 o superior | API |
| [Node.js](https://nodejs.org/) | 24 LTS | Frontend |
| Git | cualquiera reciente | Control de versiones |

Comprueba las versiones instaladas:

```bash
docker --version && dotnet --list-sdks && node --version
```

## 2. Base de datos

```bash
docker compose up -d db
```

Este comando levanta PostgreSQL 17 en `127.0.0.1:5434`, con la base de datos, el usuario y la contraseña de desarrollo `academy` / `academy` / `academy_dev_only`. Estas credenciales son públicas a propósito y **solo sirven en local**.

Si el puerto 5434 está ocupado, elige otro con `ACADEMY_DB_PORT=5440 docker compose up -d db` y cambia también la cadena de conexión (ver la sección 6).

## 3. API

```bash
dotnet run --project backend/src/Academy.Api
```

- La API escucha en `http://localhost:5080`.
- En desarrollo **aplica las migraciones automáticamente** al arrancar.
- Para comprobar que funciona, abre `http://localhost:5080/api/health`. Debe responder `{"status":"ok","database":true}`.
- El documento OpenAPI está en `http://localhost:5080/openapi/v1.json` (solo en desarrollo).

## 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

Abre `http://localhost:5173`. Vite redirige las peticiones de `/api` a la API, así que el navegador lo ve todo como un solo origen.

## 5. Pruebas y comprobaciones

```bash
# Backend: pruebas unitarias y de integración (las de integración necesitan Docker en ejecución)
cd backend && dotnet test

# Frontend
cd frontend && npm run lint && npm run typecheck && npm test && npm run build
```

Las pruebas de integración crean su propio contenedor de PostgreSQL desechable con [Testcontainers](https://dotnet.testcontainers.org/), así que no tocan tu base de datos local.

## 6. Configuración

La API se configura con `appsettings.json` y variables de entorno, donde `__` separa las secciones. Los valores de desarrollo están en `backend/src/Academy.Api/appsettings.Development.json`. El archivo [.env.example](../.env.example) recoge todas las variables.

| Variable | Descripción |
|---|---|
| `ConnectionStrings__Academy` | Cadena de conexión de PostgreSQL |
| `Platform__Name` | Nombre visible de la plataforma |
| `Database__MigrateOnStartup` | Aplica las migraciones al arrancar (`true` solo en desarrollo) |
| `Cors__AllowedOrigins__0` | Origen permitido por CORS, si el frontend está en otro dominio |
| `VITE_PLATFORM_NAME` | Nombre en el frontend (`frontend/.env`, valor público) |
| `VITE_SOURCE_URL` | URL del código fuente que se muestra en el pie. **Obligatoria en despliegues públicos** (AGPL-3.0, sección 13) |

Para guardar secretos locales de la API, usa los [secretos de usuario](https://learn.microsoft.com/aspnet/core/security/app-secrets) en lugar de archivos versionados:

```bash
dotnet user-secrets set "ConnectionStrings:Academy" "..." --project backend/src/Academy.Api
```

## 7. Migraciones

```bash
cd backend
dotnet tool restore                                    # instala dotnet-ef (versión fijada en dotnet-tools.json)
dotnet ef migrations add NombreDelCambio -p src/Academy.Api -o Infrastructure/Persistence/Migrations
dotnet ef database update -p src/Academy.Api
```

La CI falla si el modelo cambia sin su migración correspondiente.

## 8. Problemas frecuentes

- **`Address already in use` en el puerto 5000:** en macOS, el receptor AirPlay ocupa ese puerto. La API usa el 5080 para evitarlo.
- **Las pruebas de integración fallan con «Docker is either not running…»:** arranca Docker. Si usas Colima y Testcontainers no encuentra el socket, exporta `DOCKER_HOST=unix://$HOME/.colima/default/docker.sock` y `TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE=/var/run/docker.sock`.
- **`/api/health` devuelve 503:** la API funciona, pero no puede conectar con PostgreSQL. Comprueba `docker compose ps`.
- **Quiero empezar con una base de datos vacía:** ejecuta `docker compose down -v`. **Esto borra todos los datos locales.**
