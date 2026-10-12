using Microsoft.AspNetCore.Identity;

namespace Academy.Api.Modules.Identity;

/// <summary>
/// Comando de consola para tareas de operación que no deben exponerse por HTTP, como crear el
/// primer administrador. Requiere acceso a la base de datos, es decir, ser quien opera el servidor:
/// <code>dotnet run --project backend/src/Academy.Api -- roles grant correo@ejemplo.org Admin</code>
/// </summary>
internal static class RoleCommands
{
    public static bool IsRoleCommand(string[] args) => args.Length > 0 && args[0] == "roles";

    public static async Task<int> RunAsync(IServiceProvider services, string[] args)
    {
        if (args is not ["roles", var action and ("grant" or "revoke"), var email, var role])
        {
            await Console.Error.WriteLineAsync("Uso: roles grant|revoke <correo> <rol>");
            await Console.Error.WriteLineAsync($"Roles: {string.Join(", ", Roles.All)}");
            return 2;
        }

        if (Roles.Find(role) is not { } roleName)
        {
            await Console.Error.WriteLineAsync($"Rol desconocido. Roles: {string.Join(", ", Roles.All)}");
            return 2;
        }

        await using var scope = services.CreateAsyncScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();

        if (await userManager.FindByEmailAsync(email) is not { } user)
        {
            await Console.Error.WriteLineAsync("No existe ninguna cuenta con ese correo. La persona debe registrarse primero.");
            return 1;
        }

        var result = action == "grant"
            ? await userManager.AddToRoleAsync(user, roleName)
            : await userManager.RemoveFromRoleAsync(user, roleName);

        if (!result.Succeeded)
        {
            await Console.Error.WriteLineAsync(string.Join(Environment.NewLine, result.Errors.Select(e => e.Description)));
            return 1;
        }

        await userManager.UpdateSecurityStampAsync(user);
        await Console.Out.WriteLineAsync($"Hecho. Roles actuales: {string.Join(", ", await userManager.GetRolesAsync(user))}");
        return 0;
    }
}
