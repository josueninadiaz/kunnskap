using Academy.Api.Common.Platform;
using Academy.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Extensions.Options;

namespace Academy.Api.Modules.Platform;

internal sealed record PlatformInfoResponse(string Name, string DefaultLanguage);

internal sealed record HealthResponse(string Status, bool Database);

internal static class PlatformEndpoints
{
    public static IEndpointRouteBuilder MapPlatformEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api").WithTags("Platform");

        group.MapGet("/platform", GetPlatformInfo)
            .WithSummary("Datos públicos de la plataforma (nombre configurable, idioma por defecto).");

        group.MapGet("/health", GetHealthAsync)
            .WithSummary("Estado de la API y de la conexión con la base de datos.");

        return app;
    }

    private static Ok<PlatformInfoResponse> GetPlatformInfo(IOptions<PlatformOptions> options) =>
        TypedResults.Ok(new PlatformInfoResponse(options.Value.Name, options.Value.DefaultLanguage));

    private static async Task<Results<Ok<HealthResponse>, JsonHttpResult<HealthResponse>>> GetHealthAsync(
        AcademyDbContext db,
        CancellationToken cancellationToken)
    {
        var databaseOk = await db.Database.CanConnectAsync(cancellationToken);

        return databaseOk
            ? TypedResults.Ok(new HealthResponse("ok", Database: true))
            : TypedResults.Json(
                new HealthResponse("degraded", Database: false),
                statusCode: StatusCodes.Status503ServiceUnavailable);
    }
}
