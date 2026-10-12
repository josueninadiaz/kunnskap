using System.Globalization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

namespace Academy.Api.Common.Security;

internal sealed class AuthRateLimitOptions
{
    public const string SectionName = "RateLimiting:Auth";

    /// <summary>Peticiones permitidas por IP y ventana en los endpoints de autenticación.</summary>
    public int PermitLimit { get; init; } = 10;

    public int WindowSeconds { get; init; } = 60;
}

internal static class RateLimiting
{
    public const string AuthPolicy = "auth";

    /// <summary>
    /// Limita los intentos de registro e inicio de sesión por dirección IP para frenar ataques de
    /// fuerza bruta y la creación masiva de cuentas. Complementa el bloqueo de cuenta de Identity.
    /// Nota de despliegue: detrás de un proxy hay que configurar ForwardedHeaders para obtener la IP real.
    /// </summary>
    public static IServiceCollection AddConfiguredRateLimiting(this IServiceCollection services, IConfiguration configuration)
    {
        var auth = configuration.GetSection(AuthRateLimitOptions.SectionName).Get<AuthRateLimitOptions>() ?? new();

        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

            options.AddPolicy(AuthPolicy, context =>
                RateLimitPartition.GetFixedWindowLimiter(
                    context.Connection.RemoteIpAddress?.ToString() ?? "desconocida",
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = auth.PermitLimit,
                        Window = TimeSpan.FromSeconds(auth.WindowSeconds),
                        QueueLimit = 0,
                    }));

            options.OnRejected = async (context, cancellationToken) =>
            {
                if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
                {
                    context.HttpContext.Response.Headers.RetryAfter =
                        ((int)retryAfter.TotalSeconds).ToString(CultureInfo.InvariantCulture);
                }

                var problems = context.HttpContext.RequestServices.GetRequiredService<IProblemDetailsService>();
                await problems.WriteAsync(new ProblemDetailsContext
                {
                    HttpContext = context.HttpContext,
                    ProblemDetails =
                    {
                        Status = StatusCodes.Status429TooManyRequests,
                        Title = "Demasiados intentos.",
                        Detail = "Espera un minuto antes de volver a intentarlo.",
                    },
                });
            };
        });

        return services;
    }
}
