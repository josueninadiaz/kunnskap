using System.Security.Claims;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;

namespace Academy.Api.Modules.Identity;

internal sealed record UserRolesResponse(Guid UserId, IReadOnlyList<string> Roles);

/// <summary>Gestión de roles. Requiere el permiso <c>users:manage</c> (solo administradores).</summary>
internal static partial class UserAdminEndpoints
{
    public static IEndpointRouteBuilder MapUserAdminEndpoints(this IEndpointRouteBuilder api)
    {
        var group = api.MapGroup("/admin/users")
            .WithTags("Administración de usuarios")
            .RequireAuthorization(Permissions.UsersManage);

        group.MapPut("/{userId:guid}/roles/{role}", GrantRoleAsync)
            .WithSummary("Asigna un rol a una persona.");

        group.MapDelete("/{userId:guid}/roles/{role}", RevokeRoleAsync)
            .WithSummary("Retira un rol a una persona. Nadie puede quitarse a sí mismo el rol de administrador.");

        return api;
    }

    private static async Task<Results<Ok<UserRolesResponse>, NotFound, ProblemHttpResult>> GrantRoleAsync(
        Guid userId,
        string role,
        UserManager<User> userManager,
        ClaimsPrincipal actor,
        ILoggerFactory loggerFactory)
    {
        if (Roles.Find(role) is not { } roleName)
        {
            return UnknownRole();
        }

        if (await userManager.FindByIdAsync(userId.ToString()) is not { } user)
        {
            return TypedResults.NotFound();
        }

        if (!await userManager.IsInRoleAsync(user, roleName))
        {
            EnsureSucceeded(await userManager.AddToRoleAsync(user, roleName));
            // Invalida las sesiones abiertas para que el cambio de permisos se aplique pronto.
            EnsureSucceeded(await userManager.UpdateSecurityStampAsync(user));
            var logger = loggerFactory.CreateLogger(typeof(UserAdminEndpoints));
            var actorId = ActorId(actor);
            LogRoleGranted(logger, actorId, user.Id, roleName);
        }

        return TypedResults.Ok(new UserRolesResponse(user.Id, [.. await userManager.GetRolesAsync(user)]));
    }

    private static async Task<Results<Ok<UserRolesResponse>, NotFound, ProblemHttpResult>> RevokeRoleAsync(
        Guid userId,
        string role,
        UserManager<User> userManager,
        ClaimsPrincipal actor,
        ILoggerFactory loggerFactory)
    {
        if (Roles.Find(role) is not { } roleName)
        {
            return UnknownRole();
        }

        if (roleName == Roles.Admin && ActorId(actor) == userId)
        {
            return TypedResults.Problem(
                statusCode: StatusCodes.Status409Conflict,
                title: "No puedes quitarte el rol de administrador.",
                detail: "Pide a otra persona administradora que lo haga, para no dejar la plataforma sin administración.");
        }

        if (await userManager.FindByIdAsync(userId.ToString()) is not { } user)
        {
            return TypedResults.NotFound();
        }

        if (await userManager.IsInRoleAsync(user, roleName))
        {
            EnsureSucceeded(await userManager.RemoveFromRoleAsync(user, roleName));
            EnsureSucceeded(await userManager.UpdateSecurityStampAsync(user));
            var logger = loggerFactory.CreateLogger(typeof(UserAdminEndpoints));
            var actorId = ActorId(actor);
            LogRoleRevoked(logger, actorId, user.Id, roleName);
        }

        return TypedResults.Ok(new UserRolesResponse(user.Id, [.. await userManager.GetRolesAsync(user)]));
    }

    private static Guid? ActorId(ClaimsPrincipal actor) =>
        Guid.TryParse(actor.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;

    private static ProblemHttpResult UnknownRole() =>
        TypedResults.Problem(
            statusCode: StatusCodes.Status400BadRequest,
            title: "Rol desconocido.",
            detail: $"Los roles válidos son: {string.Join(", ", Roles.All)}.");

    private static void EnsureSucceeded(IdentityResult result)
    {
        if (!result.Succeeded)
        {
            throw new InvalidOperationException(
                $"Operación de Identity fallida: {string.Join(", ", result.Errors.Select(e => e.Code))}");
        }
    }

    [LoggerMessage(Level = LogLevel.Information, Message = "Rol {Role} asignado a {UserId} por {ActorId}")]
    private static partial void LogRoleGranted(ILogger logger, Guid? actorId, Guid userId, string role);

    [LoggerMessage(Level = LogLevel.Information, Message = "Rol {Role} retirado a {UserId} por {ActorId}")]
    private static partial void LogRoleRevoked(ILogger logger, Guid? actorId, Guid userId, string role);
}
