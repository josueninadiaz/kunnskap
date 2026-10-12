# Modelo de amenazas (versión inicial)

> Revisar este documento en cada fase. Última revisión: 2026-10-12 (fase 2, autenticación).

## Activos

1. Cuentas de estudiantes: correo, nombre visible y hash de contraseña.
2. Datos de aprendizaje: progreso, intentos y resultados.
3. Contenido educativo y su integridad (que nadie pueda publicar contenido malicioso o falso).
4. Permisos administrativos.
5. Disponibilidad del servicio.

## Amenazas principales y controles

| Amenaza | Control | Estado |
|---|---|---|
| Robo de credenciales por fuerza bruta | Bloqueo de Identity (5 intentos, 15 min), 10 intentos por minuto e IP en registro e inicio de sesión, y contraseñas de al menos 12 caracteres | Activo y probado |
| Robo de sesión por XSS | Cookie `HttpOnly`, Markdown sin HTML crudo, CSP y prohibición de `dangerouslySetInnerHTML` en el linter | Linter y CSP de la API activos; CSP del frontend en la fase 4 |
| CSRF | Cookie `SameSite=Strict` y token antiforgery obligatorio en la cabecera `X-XSRF-TOKEN` para todo POST, PUT, PATCH o DELETE en `/api`, incluidos registro e inicio de sesión | Activo y probado |
| Escalada de privilegios (un estudiante actúa como editor) | Políticas por permiso en el servidor, permisos como claims en la sesión, sesión revalidada cada 5 minutos tras un cambio de roles, el primer administrador solo se crea por consola y un administrador no puede quitarse su propio rol | Activo y probado (401, 403 y 200) |
| Exposición de respuestas de evaluaciones | DTO específicos que nunca serializan `IsCorrect` antes de enviar el intento, verificado con pruebas | Fase 2 |
| Enumeración de cuentas | El inicio de sesión responde con el mismo mensaje y en un tiempo similar (hash simulado) exista o no la cuenta. **Limitación conocida:** el registro sí indica que un correo ya está registrado, en favor de la usabilidad. Se mitiga con la limitación de intentos y se revisará cuando exista la confirmación por correo | Parcial |
| Sesiones en ordenadores compartidos | Por defecto la cookie de sesión termina al cerrar el navegador. La persistencia de 14 días es opcional («Mantener la sesión iniciada») | Activo |
| Robo o pérdida de las claves que cifran las cookies | Claves de Data Protection guardadas en PostgreSQL, compartidas por todas las instancias. **Pendiente:** cifrarlas en reposo (Azure Key Vault) antes de producción | Parcial |
| Redirección abierta tras el inicio de sesión | El parámetro `volver` solo acepta rutas internas | Activo y probado |
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
- [ ] `ForwardedHeaders` está configurado si hay un proxy, para que la limitación de intentos use la IP real del cliente y no la del proxy.
- [ ] Las claves de Data Protection están protegidas en reposo.
- [ ] Las migraciones se han revisado y aplicado como un paso explícito, con una copia de seguridad previa.
- [ ] Se ha probado restaurar una copia de seguridad en el último mes.
- [ ] El OpenAPI y la documentación de la API no están expuestos públicamente, salvo que sea intencionado.
- [ ] Los logs se han revisado y no contienen datos sensibles.
- [ ] `VITE_SOURCE_URL` apunta al código fuente exacto que se despliega (obligatorio por la sección 13 de la AGPL) y el pie de página muestra la atribución al autor original.
