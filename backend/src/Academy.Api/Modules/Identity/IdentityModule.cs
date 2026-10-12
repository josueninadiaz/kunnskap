using Academy.Api.Common.Security;
using Academy.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;

namespace Academy.Api.Modules.Identity;

internal static class IdentityModule
{
    public const string SessionCookieName = "kunnskap_session";

    public static IServiceCollection AddIdentityModule(this IServiceCollection services, IWebHostEnvironment environment)
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
            .AddEntityFrameworkStores<AcademyDbContext>()
            .AddSignInManager()
            .AddClaimsPrincipalFactory<PermissionClaimsFactory>()
            .AddErrorDescriber<SpanishIdentityErrorDescriber>();

        services.AddAuthentication(IdentityConstants.ApplicationScheme)
            .AddIdentityCookies();

        services.ConfigureApplicationCookie(options =>
        {
            options.Cookie.Name = SessionCookieName;
            options.Cookie.HttpOnly = true;
            options.Cookie.SameSite = SameSiteMode.Strict;
            options.Cookie.SecurePolicy = environment.IsDevelopment()
                ? CookieSecurePolicy.SameAsRequest
                : CookieSecurePolicy.Always;
            options.ExpireTimeSpan = TimeSpan.FromDays(14);
            options.SlidingExpiration = true;

            // Es una API: responder 401/403 en lugar de redirigir a una página de login.
            options.Events.OnRedirectToLogin = context =>
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                return Task.CompletedTask;
            };
            options.Events.OnRedirectToAccessDenied = context =>
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                return Task.CompletedTask;
            };
        });

        // Cada 5 minutos se comprueba que la sesión sigue siendo válida (p. ej. tras un cambio de roles
        // o de contraseña, que actualizan el security stamp).
        services.Configure<SecurityStampValidatorOptions>(options =>
            options.ValidationInterval = TimeSpan.FromMinutes(5));

        services.AddAuthorizationBuilder()
            .AddPolicy(Permissions.ContentManage, p => p.RequireClaim(Permissions.ClaimType, Permissions.ContentManage))
            .AddPolicy(Permissions.ContentPublish, p => p.RequireClaim(Permissions.ClaimType, Permissions.ContentPublish))
            .AddPolicy(Permissions.CohortsManage, p => p.RequireClaim(Permissions.ClaimType, Permissions.CohortsManage))
            .AddPolicy(Permissions.UsersManage, p => p.RequireClaim(Permissions.ClaimType, Permissions.UsersManage));

        services.AddAntiforgery(options =>
        {
            options.HeaderName = AntiforgeryDefaults.HeaderName;
            options.Cookie.Name = AntiforgeryDefaults.CookieName;
            options.Cookie.HttpOnly = true;
            options.Cookie.SameSite = SameSiteMode.Strict;
            options.SuppressXFrameOptionsHeader = true; // Ya se envía X-Frame-Options: DENY.
        });

        // Claves que cifran las cookies, guardadas en PostgreSQL: las sesiones sobreviven a reinicios
        // y funcionan con varias instancias de la API.
        services.AddDataProtection()
            .SetApplicationName("Kunnskap")
            .PersistKeysToDbContext<AcademyDbContext>();

        return services;
    }
}
