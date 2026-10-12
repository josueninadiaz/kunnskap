using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Academy.Api.IntegrationTests.Infrastructure;

/// <summary>
/// Arranca la API real en memoria contra el PostgreSQL de <see cref="PostgresFixture"/>.
/// Usa el entorno "Production" para comprobar el comportamiento que verán los usuarios
/// (sin páginas de excepción de desarrollador y con cookies Secure).
/// </summary>
public sealed class AcademyApiFactory(PostgresFixture postgres, IReadOnlyDictionary<string, string>? settings = null)
    : WebApplicationFactory<Program>
{
    public const string PlatformName = "Academia de Pruebas";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Production");
        builder.UseSetting("ConnectionStrings:Academy", postgres.ConnectionString);
        builder.UseSetting("Database:MigrateOnStartup", "false"); // Ya las aplica PostgresFixture.
        builder.UseSetting("Platform:Name", PlatformName);
        // Límite alto por defecto para que las pruebas no interfieran entre sí; las de rate limiting lo reducen.
        builder.UseSetting("RateLimiting:Auth:PermitLimit", "1000");

        foreach (var (key, value) in settings ?? new Dictionary<string, string>())
        {
            builder.UseSetting(key, value);
        }
    }

    /// <summary>Cliente HTTPS con cookies, como un navegador.</summary>
    public HttpClient CreateBrowserClient() =>
        CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost") });
}
