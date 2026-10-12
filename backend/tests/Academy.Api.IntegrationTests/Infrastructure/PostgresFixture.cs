using Testcontainers.PostgreSql;

[assembly: AssemblyFixture(typeof(Academy.Api.IntegrationTests.Infrastructure.PostgresFixture))]

namespace Academy.Api.IntegrationTests.Infrastructure;

/// <summary>
/// Un único contenedor de PostgreSQL real para todo el ensamblado de pruebas de integración.
/// Requiere Docker en ejecución.
/// </summary>
public sealed class PostgresFixture : IAsyncLifetime
{
    private readonly PostgreSqlContainer _container = new PostgreSqlBuilder("postgres:17.11-alpine").Build();

    public string ConnectionString => _container.GetConnectionString();

    public async ValueTask InitializeAsync() => await _container.StartAsync();

    public async ValueTask DisposeAsync() => await _container.DisposeAsync();
}
