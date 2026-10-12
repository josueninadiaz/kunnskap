using System.Diagnostics;

namespace Academy.Api.Common.Errors;

internal static class ProblemDetailsExtensions
{
    /// <summary>
    /// Todas las respuestas de error usan <c>application/problem+json</c>. Fuera de desarrollo
    /// nunca se incluyen trazas ni mensajes de excepción; solo un <c>traceId</c> para soporte.
    /// </summary>
    public static IServiceCollection AddProblemDetailsHandling(this IServiceCollection services)
    {
        services.AddProblemDetails(options =>
        {
            options.CustomizeProblemDetails = context =>
            {
                context.ProblemDetails.Instance = null;
                context.ProblemDetails.Extensions["traceId"] =
                    Activity.Current?.Id ?? context.HttpContext.TraceIdentifier;

                if (context.ProblemDetails.Status == StatusCodes.Status500InternalServerError)
                {
                    context.ProblemDetails.Title = "Se produjo un error inesperado.";
                    context.ProblemDetails.Detail =
                        "Inténtalo de nuevo más tarde. Si el problema continúa, comunica el identificador traceId.";
                    context.ProblemDetails.Extensions.Remove("exception");
                }
            };
        });

        return services;
    }
}
