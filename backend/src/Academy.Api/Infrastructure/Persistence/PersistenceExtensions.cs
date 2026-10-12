using Academy.Api.Common.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Academy.Api.Infrastructure.Persistence;

internal static partial class PersistenceExtensions
{
    public static IServiceCollection AddPersistence(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Academy")
            ?? throw new InvalidOperationException(
                "Falta la cadena de conexión 'ConnectionStrings:Academy'. Consulta docs/desarrollo-local.md.");

        services.AddSingleton<AuditableInterceptor>();
        services.AddDbContext<AcademyDbContext>((sp, options) => options
            .UseNpgsql(connectionString, npgsql => npgsql.MigrationsHistoryTable("__ef_migrations_history"))
            .UseSnakeCaseNamingConvention()
            .AddInterceptors(sp.GetRequiredService<AuditableInterceptor>()));

        return services;
    }

    /// <summary>
    /// Aplica las migraciones pendientes al arrancar solo si <c>Database:MigrateOnStartup</c> es
    /// <c>true</c> (activado en desarrollo). En producción las migraciones se aplican como paso
    /// explícito del despliegue.
    /// </summary>
    public static async Task ApplyMigrationsIfConfiguredAsync(this WebApplication app)
    {
        if (!app.Configuration.GetValue<bool>("Database:MigrateOnStartup"))
        {
            return;
        }

        await using var scope = app.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AcademyDbContext>();
        await db.Database.MigrateAsync();
        LogMigrationsApplied(app.Logger);
    }

    [LoggerMessage(Level = LogLevel.Information, Message = "Migraciones de base de datos aplicadas.")]
    private static partial void LogMigrationsApplied(ILogger logger);
}
