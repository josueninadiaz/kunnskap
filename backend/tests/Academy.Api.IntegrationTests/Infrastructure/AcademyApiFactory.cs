using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Academy.Api.IntegrationTests.Infrastructure;

/// <summary>
/// Arranca la API real en memoria contra el PostgreSQL de <see cref="PostgresFixture"/>.
/// Usa el entorno "Production" para comprobar el comportamiento que verán los usuarios
/// (sin páginas de excepción de desarrollador).
/// </summary>
public sealed class AcademyApiFactory(PostgresFixture postgres) : WebApplicationFactory<Program>
{
    public const string PlatformName = "Academia de Pruebas";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Production");
        builder.UseSetting("ConnectionStrings:Academy", postgres.ConnectionString);
        builder.UseSetting("Database:MigrateOnStartup", "true");
        builder.UseSetting("Platform:Name", PlatformName);
    }
}
