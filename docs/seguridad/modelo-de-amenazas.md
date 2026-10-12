# Modelo de amenazas (versión inicial)

> Revisar este documento en cada fase. Última revisión: 2026-10-12 (fase 1).

## Activos

1. Cuentas de estudiantes: correo, nombre visible y hash de contraseña.
2. Datos de aprendizaje: progreso, intentos y resultados.
3. Contenido educativo y su integridad (que nadie pueda publicar contenido malicioso o falso).
4. Permisos administrativos.
5. Disponibilidad del servicio.

## Amenazas principales y controles

| Amenaza | Control | Estado |
|---|---|---|
| Robo de credenciales por fuerza bruta | Bloqueo de Identity (5 intentos, 15 min) y limitación de peticiones en la autenticación | Bloqueo configurado; limitación en la fase 2 |
| Robo de sesión por XSS | Cookie `HttpOnly`, Markdown sin HTML crudo, CSP y prohibición de `dangerouslySetInnerHTML` en el linter | Linter y CSP de la API activos; CSP del frontend en la fase 4 |
| CSRF | `SameSite=Strict` y token antiforgery en una cabecera | Fase 2 |
| Escalada de privilegios (un estudiante actúa como editor) | Políticas por permiso en el servidor y pruebas de integración de autorización por endpoint | Políticas definidas; pruebas en la fase 2 |
| Exposición de respuestas de evaluaciones | DTO específicos que nunca serializan `IsCorrect` antes de enviar el intento, verificado con pruebas | Fase 2 |
| Inyección SQL | Solo EF Core con consultas parametrizadas; prohibido el SQL interpolado sin parámetros | Activo |
| Fuga de información en errores | ProblemDetails sin trazas fuera de desarrollo, verificado con pruebas | Activo |
| Secretos en el repositorio | `.gitignore`, secretos de usuario en local y variables de entorno en producción. Pendiente: escaneo de secretos de GitHub cuando el repositorio sea público | Parcial |
| Datos personales en logs | No se registran cuerpos de petición, cookies ni cabeceras de autorización | Activo (no hay registro de peticiones) |
| Ejecución de código de estudiantes | Fuera del proceso de la API, en un sandbox aislado (ADR pendiente) | No implementado |
| Envío de datos personales a proveedores de IA | El tutor solo recibe la pregunta y el contexto del curso, nunca correo, nombre ni identificadores | No implementado |
| Dependencias vulnerables | Dependabot y `npm audit` / `dotnet list package --vulnerable` en la CI | Pendiente |

## Lista de comprobación antes de cada despliegue

- [ ] La CI está en verde (build, lint, pruebas y migraciones sin cambios pendientes).
- [ ] No hay dependencias con vulnerabilidades conocidas de severidad alta o crítica.
- [ ] `ASPNETCORE_ENVIRONMENT=Production` está configurado y `Database__MigrateOnStartup=false`.
- [ ] Los secretos están en el gestor de secretos o en variables de entorno, y no en los archivos.
- [ ] HTTPS es obligatorio y HSTS está activo.
- [ ] `Cors__AllowedOrigins` está vacío o solo contiene los orígenes necesarios.
- [ ] Las migraciones se han revisado y aplicado como un paso explícito, con una copia de seguridad previa.
- [ ] Se ha probado restaurar una copia de seguridad en el último mes.
- [ ] El OpenAPI y la documentación de la API no están expuestos públicamente, salvo que sea intencionado.
- [ ] Los logs se han revisado y no contienen datos sensibles.
- [ ] `VITE_SOURCE_URL` apunta al código fuente exacto que se despliega (obligatorio por la sección 13 de la AGPL) y el pie de página muestra la atribución al autor original.
