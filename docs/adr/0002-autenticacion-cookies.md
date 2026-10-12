# ADR 0002: Autenticación con ASP.NET Core Identity y cookies en el mismo origen

- **Estado:** aceptada e implementada (fase 2, tarea 1)
- **Fecha:** 2026-10-12

## Contexto

La aplicación es una SPA servida junto a su API. Hay que proteger las cuentas de estudiantes, entre ellos posibles menores de edad, y los recursos administrativos.

## Decisión

- Por defecto, la sesión termina al cerrar el navegador. La persistencia (14 días, renovable) es opcional, porque muchas personas usarán ordenadores compartidos.
- Usar **ASP.NET Core Identity** para el hash de contraseñas, el bloqueo de cuentas, los *security stamps* y los tokens de confirmación.
- Mantener la sesión con una **cookie `HttpOnly`, `Secure` y `SameSite=Strict`**.
- Servir el frontend y la API desde el **mismo origen**: el proxy de Vite en desarrollo y el mismo dominio en producción.
- Usar un **token antiforgery** enviado en la cabecera `X-XSRF-TOKEN` en todas las peticiones que modifican datos.
- Limitar la frecuencia de peticiones (`RateLimiter`) en el registro, el inicio de sesión y la recuperación de contraseña.
- Exigir contraseñas de al menos 12 caracteres, sin reglas de composición (NIST SP 800-63B).

## Alternativas consideradas

- **JWT en `localStorage`:** cualquier XSS podría robar el token, y revocar sesiones es complicado. Se descarta.
- **Proveedor externo (Entra ID, Auth0…):** añade dependencia y coste, y obliga a los estudiantes a tener otra cuenta. Puede añadirse más adelante como opción de inicio de sesión externo.

## Consecuencias

- Si en el futuro el frontend se sirve desde otro dominio, habrá que revisar `SameSite` y CORS.
- Los clientes que no sean navegadores, como una app móvil, necesitarían otro esquema, por ejemplo tokens. No está previsto por ahora.
