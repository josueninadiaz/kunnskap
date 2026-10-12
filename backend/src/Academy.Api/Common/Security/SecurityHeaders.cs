namespace Academy.Api.Common.Security;

internal static class SecurityHeaders
{
    /// <summary>
    /// Cabeceras defensivas para todas las respuestas de la API. La API solo devuelve JSON,
    /// por lo que su CSP no permite cargar ningún recurso ni ser embebida en marcos.
    /// La CSP del frontend se define donde se sirve el HTML.
    /// </summary>
    public static IApplicationBuilder UseSecurityHeaders(this IApplicationBuilder app) =>
        app.Use(async (context, next) =>
        {
            context.Response.OnStarting(() =>
            {
                var headers = context.Response.Headers;
                headers.XContentTypeOptions = "nosniff";
                headers.XFrameOptions = "DENY";
                headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
                headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
                headers["Cross-Origin-Opener-Policy"] = "same-origin";

                // La interfaz de documentación de OpenAPI no se sirve desde aquí, así que
                // una CSP restrictiva no rompe nada.
                headers.ContentSecurityPolicy = "default-src 'none'; frame-ancestors 'none'";
                return Task.CompletedTask;
            });

            await next(context);
        });
}
