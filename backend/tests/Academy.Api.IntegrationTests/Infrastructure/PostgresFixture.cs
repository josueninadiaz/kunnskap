using Academy.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Testcontainers.PostgreSql;

[assembly: AssemblyFixture(typeof(Academy.Api.IntegrationTests.Infrastructure.PostgresFixture))]

namespace Academy.Api.IntegrationTests.Infrastructure;

/// <summary>
/// Un único contenedor de PostgreSQL real para todo el ensamblado de pruebas de integración.
/// Las migraciones se aplican aquí una sola vez: si cada instancia de la API las aplicara al
/// arrancar, las clases de prueba que se ejecutan en paralelo competirían por crear las tablas.
/// Requiere Docker en ejecución.
/// </summary>
public sealed class PostgresFixture : IAsyncLifetime
{
    private readonly PostgreSqlContainer _container = new PostgreSqlBuilder("postgres:17.11-alpine").Build();

    public string ConnectionString => _container.GetConnectionString();

    public async ValueTask InitializeAsync()
    {
        await _container.StartAsync();

        var options = new DbContextOptionsBuilder<AcademyDbContext>()
            .UseNpgsql(ConnectionString, npgsql => npgsql.MigrationsHistoryTable("__ef_migrations_history"))
            .UseSnakeCaseNamingConvention()
            .Options;

        await using var db = new AcademyDbContext(options);
        await db.Database.MigrateAsync();
    }

    public async ValueTask DisposeAsync() => await _container.DisposeAsync();
}
