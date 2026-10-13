using System.Text.Json.Serialization;
using Academy.Api.Common.Errors;
using Academy.Api.Common.Platform;
using Academy.Api.Common.Security;
using Academy.Api.Infrastructure.Persistence;
using Academy.Api.Modules.Assessments;
using Academy.Api.Modules.Catalog;
using Academy.Api.Modules.Identity;
using Academy.Api.Modules.Learning;
using Academy.Api.Modules.Platform;
using Npgsql;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.ConfigureKestrel(options => options.AddServerHeader = false);

// OpenTelemetry, health checks, service discovery y resiliencia (proyecto Academy.ServiceDefaults).
// Las trazas y métricas solo se exportan si OTEL_EXPORTER_OTLP_ENDPOINT está definido (p. ej. con Aspire).
builder.AddServiceDefaults();
builder.Services.AddOpenTelemetry().WithTracing(tracing => tracing.AddNpgsql());

builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddPlatformOptions(builder.Configuration);
builder.Services.AddPersistence(builder.Configuration);
builder.Services.AddIdentityModule(builder.Environment);
builder.Services.AddCatalogModule(builder.Configuration);
builder.Services.AddConfiguredRateLimiting(builder.Configuration);

builder.Services.AddProblemDetailsHandling();
builder.Services.AddValidation();
builder.Services.ConfigureHttpJsonOptions(options =>
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));

builder.Services.AddConfiguredCors(builder.Configuration);
builder.Services.AddOpenApi();

var app = builder.Build();

await app.ApplyMigrationsIfConfiguredAsync();

// Comandos de operación (crear el primer administrador, importar contenido): se ejecutan y terminan sin levantar el servidor.
if (RoleCommands.IsRoleCommand(args))
{
    return await RoleCommands.RunAsync(app.Services, args);
}

if (ContentCommands.IsContentCommand(args))
{
    return await ContentCommands.RunAsync(app.Services, args);
}

await app.ImportContentIfConfiguredAsync();

app.UseExceptionHandler();
app.UseStatusCodePages();

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

app.UseSecurityHeaders();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapDefaultEndpoints();

// Todas las rutas de la API cuelgan de /api y exigen el token antiforgery en peticiones que modifican datos.
var api = app.MapGroup("/api").AddEndpointFilter<AntiforgeryFilter>();
api.MapPlatformEndpoints();
api.MapAuthEndpoints();
api.MapCatalogEndpoints();
api.MapLearningEndpoints();
api.MapQuizEndpoints();
api.MapUserAdminEndpoints();

await app.RunAsync();
return 0;
