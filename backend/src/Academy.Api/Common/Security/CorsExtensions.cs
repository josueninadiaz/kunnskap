namespace Academy.Api.Common.Security;

internal static class CorsExtensions
{
    /// <summary>
    /// En desarrollo y en producción el frontend se sirve desde el mismo origen que la API
    /// (proxy de Vite / servidor web), por lo que CORS no es necesario. Solo se habilita para
    /// los orígenes listados explícitamente en <c>Cors:AllowedOrigins</c>.
    /// </summary>
    public static IServiceCollection AddConfiguredCors(this IServiceCollection services, IConfiguration configuration)
    {
        var origins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];

        services.AddCors(options => options.AddDefaultPolicy(policy =>
        {
            if (origins.Length == 0)
            {
                return;
            }

            policy.WithOrigins(origins)
                .WithMethods("GET", "POST", "PUT", "PATCH", "DELETE")
                .WithHeaders("Content-Type", "X-XSRF-TOKEN")
                .AllowCredentials();
        }));

        return services;
    }
}
