using Academy.Api.Modules.Catalog.Content;
using Microsoft.Extensions.Options;

namespace Academy.Api.Modules.Catalog;

internal static class CatalogModule
{
    public static IServiceCollection AddCatalogModule(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<ContentOptions>(configuration.GetSection(ContentOptions.SectionName));
        services.AddScoped<ContentImporter>();
        return services;
    }

    public static string ResolveContentPath(this IServiceProvider services)
    {
        var options = services.GetRequiredService<IOptions<ContentOptions>>().Value;
        var root = services.GetRequiredService<IHostEnvironment>().ContentRootPath;
        return Path.GetFullPath(Path.Combine(root, options.Path));
    }

    /// <summary>En desarrollo, el catálogo se sincroniza con content/ en cada arranque.</summary>
    public static async Task ImportContentIfConfiguredAsync(this WebApplication app)
    {
        if (!app.Services.GetRequiredService<IOptions<ContentOptions>>().Value.ImportOnStartup)
        {
            return;
        }

        await using var scope = app.Services.CreateAsyncScope();
        await scope.ServiceProvider.GetRequiredService<ContentImporter>().ImportAsync(app.Services.ResolveContentPath());
    }
}

/// <summary>
/// <code>dotnet run --project backend/src/Academy.Api -- content import</code>
/// </summary>
internal static class ContentCommands
{
    public static bool IsContentCommand(string[] args) => args.Length > 0 && args[0] == "content";

    public static async Task<int> RunAsync(IServiceProvider services, string[] args)
    {
        if (args is not ["content", "import"])
        {
            await Console.Error.WriteLineAsync("Uso: content import");
            return 2;
        }

        await using var scope = services.CreateAsyncScope();
        var importer = scope.ServiceProvider.GetRequiredService<ContentImporter>();

        try
        {
            var result = await importer.ImportAsync(services.ResolveContentPath());
            await Console.Out.WriteLineAsync(
                $"Importado: {result.Schools} escuelas, {result.Technologies} tecnologías, {result.Courses} cursos, {result.Lessons} lecciones, {result.Quizzes} cuestionarios.");
            return 0;
        }
        catch (ContentValidationException ex)
        {
            await Console.Error.WriteLineAsync(ex.Message);
            return 1;
        }
    }
}
