using System.Text.Json.Serialization;
using Academy.Api.Common.Errors;
using Academy.Api.Common.Platform;
using Academy.Api.Common.Security;
using Academy.Api.Infrastructure.Persistence;
using Academy.Api.Modules.Identity;
using Academy.Api.Modules.Platform;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.ConfigureKestrel(options => options.AddServerHeader = false);

builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddPlatformOptions(builder.Configuration);
builder.Services.AddPersistence(builder.Configuration);
builder.Services.AddIdentityModule();

builder.Services.AddProblemDetailsHandling();
builder.Services.AddValidation();
builder.Services.ConfigureHttpJsonOptions(options =>
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));

builder.Services.AddConfiguredCors(builder.Configuration);
builder.Services.AddOpenApi();

var app = builder.Build();

app.UseExceptionHandler();
app.UseStatusCodePages();

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

app.UseSecurityHeaders();
app.UseCors();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapPlatformEndpoints();

await app.ApplyMigrationsIfConfiguredAsync();

await app.RunAsync();
