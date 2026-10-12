var builder = DistributedApplication.CreateBuilder(args);

// Misma versión de PostgreSQL que docker-compose.yml y las pruebas de integración.
// La contraseña la genera Aspire y se guarda en los secretos de usuario del AppHost (nunca en el repositorio).
var postgres = builder.AddPostgres("postgres")
    .WithImageTag("17.11-alpine")
    .WithDataVolume("kunnskap-aspire-postgres")
    .WithLifetime(ContainerLifetime.Persistent);

var database = postgres.AddDatabase("academy");

var api = builder.AddProject<Projects.Academy_Api>("api")
    .WithReference(database)
    .WaitFor(database)
    .WithHttpHealthCheck("/api/health");

builder.AddViteApp("web", "../../../frontend")
    .WithEnvironment("ACADEMY_API_URL", api.GetEndpoint("http"))
    .WaitFor(api)
    .WithExternalHttpEndpoints();

await builder.Build().RunAsync();
