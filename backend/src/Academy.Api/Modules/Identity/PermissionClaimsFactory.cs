using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;

namespace Academy.Api.Modules.Identity;

/// <summary>
/// Añade a la sesión un claim <c>permission</c> por cada permiso de los roles del usuario.
/// Las políticas de autorización comprueban esos claims, nunca el nombre del rol.
/// </summary>
internal sealed class PermissionClaimsFactory(
    UserManager<User> userManager,
    RoleManager<Role> roleManager,
    IOptions<IdentityOptions> options)
    : UserClaimsPrincipalFactory<User, Role>(userManager, roleManager, options)
{
    protected override async Task<ClaimsIdentity> GenerateClaimsAsync(User user)
    {
        var identity = await base.GenerateClaimsAsync(user);
        var roles = await UserManager.GetRolesAsync(user);

        var permissions = roles
            .SelectMany(role => Roles.PermissionsByRole.TryGetValue(role, out var p) ? p : [])
            .Distinct(StringComparer.Ordinal);

        foreach (var permission in permissions)
        {
            identity.AddClaim(new Claim(Permissions.ClaimType, permission));
        }

        return identity;
    }
}
