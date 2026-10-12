#!/usr/bin/env bash
# Se ejecuta una vez al crear el contenedor: descarga dependencias para que todo arranque al primer intento.
set -euo pipefail

echo "==> Restaurando paquetes .NET"
dotnet restore backend
(cd backend && dotnet tool restore)

echo "==> Instalando dependencias del frontend"
(cd frontend && npm ci)

cat <<'MSG'

Listo. Para arrancar todo (PostgreSQL, API y web):

  dotnet run --project backend/src/Academy.AppHost

Se abrirá el panel de Aspire con los enlaces a la web y a la API.
MSG
