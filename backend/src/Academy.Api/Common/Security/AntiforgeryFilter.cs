using Microsoft.AspNetCore.Antiforgery;

namespace Academy.Api.Common.Security;

internal static class AntiforgeryDefaults
{
    public const string HeaderName = "X-XSRF-TOKEN";
    public const string CookieName = "kunnskap_af";
}

/// <summary>
/// Protección CSRF para la API JSON: toda petición que modifica datos (POST, PUT, PATCH, DELETE)
/// debe incluir la cabecera <c>X-XSRF-TOKEN</c> obtenida de <c>GET /api/auth/antiforgery</c>.
/// Se aplica también a registro e inicio de sesión (protege contra "login CSRF").
/// </summary>
internal sealed class AntiforgeryFilter(IAntiforgery antiforgery) : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var httpContext = context.HttpContext;
        var method = httpContext.Request.Method;

        if (HttpMethods.IsGet(method) || HttpMethods.IsHead(method) || HttpMethods.IsOptions(method))
        {
            return await next(context);
        }

        try
        {
            await antiforgery.ValidateRequestAsync(httpContext);
        }
        catch (AntiforgeryValidationException)
        {
            return TypedResults.Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Token de seguridad ausente o caducado.",
                detail: "Recarga la página e inténtalo de nuevo.",
                extensions: new Dictionary<string, object?> { ["code"] = "antiforgery" });
        }

        return await next(context);
    }
}
