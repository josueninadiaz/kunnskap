using Academy.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;

namespace Academy.Api.Modules.Identity;

internal static class IdentityModule
{
    public static IServiceCollection AddIdentityModule(this IServiceCollection services)
    {
        services.AddIdentityCore<User>(options =>
            {
                options.User.RequireUniqueEmail = true;

                // Contraseñas largas en lugar de reglas de composición (recomendación NIST SP 800-63B).
                options.Password.RequiredLength = 12;
                options.Password.RequireDigit = false;
                options.Password.RequireLowercase = false;
                options.Password.RequireUppercase = false;
                options.Password.RequireNonAlphanumeric = false;

                options.Lockout.AllowedForNewUsers = true;
                options.Lockout.MaxFailedAccessAttempts = 5;
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
            })
            .AddRoles<Role>()
            .AddEntityFrameworkStores<AcademyDbContext>();

        services.AddAuthorizationBuilder()
            .AddPolicy(Permissions.ContentManage, p => p.RequireClaim(Permissions.ClaimType, Permissions.ContentManage))
            .AddPolicy(Permissions.ContentPublish, p => p.RequireClaim(Permissions.ClaimType, Permissions.ContentPublish))
            .AddPolicy(Permissions.UsersManage, p => p.RequireClaim(Permissions.ClaimType, Permissions.UsersManage));

        return services;
    }
}
