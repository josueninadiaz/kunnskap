using Academy.Api.Infrastructure.Persistence;
using Academy.Api.IntegrationTests.Infrastructure;
using Academy.Api.Modules.Catalog;
using Academy.Api.Modules.Catalog.Content;
using Academy.Api.Modules.Catalog.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Academy.Api.IntegrationTests.Catalog;

/// <summary>
/// Valida el contenido REAL de content/: un pull request con YAML mal formado o incoherente hace
/// fallar la CI antes de llegar a la base de datos.
/// </summary>
public sealed class ContentImportTests(PostgresFixture postgres) : IDisposable
{
    private readonly AcademyApiFactory _factory = new(postgres);
    private readonly List<string> _tempDirs = [];

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    private async Task<ImportResult> ImportAsync(string path)
    {
        _ = _factory.Server;
        await using var scope = _factory.Services.CreateAsyncScope();
        return await scope.ServiceProvider.GetRequiredService<ContentImporter>().ImportAsync(path, Ct);
    }

    private string RepositoryContentPath()
    {
        _ = _factory.Server;
        return _factory.Services.ResolveContentPath();
    }

    private string TempContent(string schoolsYaml, string technologiesYaml, params (string Path, string Yaml)[] courses)
    {
        var dir = Path.Combine(Path.GetTempPath(), "kunnskap-content-" + Guid.NewGuid().ToString("N"));
        _tempDirs.Add(dir);
        Directory.CreateDirectory(dir);
        File.WriteAllText(Path.Combine(dir, "escuelas.yml"), schoolsYaml);
        File.WriteAllText(Path.Combine(dir, "tecnologias.yml"), technologiesYaml);
        foreach (var (path, yaml) in courses)
        {
            var file = Path.Combine(dir, "cursos", path, "curso.yml");
            Directory.CreateDirectory(Path.GetDirectoryName(file)!);
            File.WriteAllText(file, yaml);
        }

        return dir;
    }

    [Fact]
    public async Task Repository_content_is_valid_and_import_is_idempotent()
    {
        var path = RepositoryContentPath();
        Assert.True(File.Exists(Path.Combine(path, "escuelas.yml")), $"No se encontró content/ en {path}");

        var first = await ImportAsync(path);
        var second = await ImportAsync(path);

        Assert.Equal(first, second);
        Assert.True(first.Courses > 0);

        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AcademyDbContext>();
        var csharp = await db.Courses
            .Include(c => c.Modules)
            .SingleAsync(c => c.Slug == "programar-desde-cero-con-csharp", Ct);

        Assert.Equal(ContentStatus.InDevelopment, csharp.Status);
        Assert.Equal("content/cursos/fundamentos/programar-desde-cero-con-csharp/curso.yml", csharp.SourcePath);
        Assert.Contains("Josue Nina Diaz", csharp.Authors);
        Assert.Equal(csharp.Modules.Count, csharp.Modules.Select(m => m.SortOrder).Distinct().Count());
    }

    [Fact]
    public async Task Invalid_content_reports_every_error_at_once()
    {
        var dir = TempContent(
            "- { slug: escuela-ok, order: 1, name: Escuela, description: Descripción }",
            "- { slug: tec, name: Tec }",
            ("escuela-ok/curso-mal", """
                slug: Curso Mal
                school: no-existe
                order: 1
                title: ""
                summary: Resumen
                level: Experto
                status: InDevelopment
                technologies: [desconocida]
                """));

        var ex = await Assert.ThrowsAsync<ContentValidationException>(() => ImportAsync(dir));

        Assert.Contains(ex.Errors, e => e.Contains("slug «Curso Mal»", StringComparison.Ordinal));
        Assert.Contains(ex.Errors, e => e.Contains("escuela «no-existe»", StringComparison.Ordinal));
        Assert.Contains(ex.Errors, e => e.Contains("falta title", StringComparison.Ordinal));
        Assert.Contains(ex.Errors, e => e.Contains("level", StringComparison.Ordinal));
        Assert.Contains(ex.Errors, e => e.Contains("tecnología «desconocida»", StringComparison.Ordinal));
    }

    [Fact]
    public async Task Courses_cannot_be_published_without_duration_objectives_review_and_lessons()
    {
        var school = $"escuela-{Guid.NewGuid():N}";
        var dir = TempContent(
            $"- {{ slug: {school}, order: 1, name: Escuela, description: Descripción }}",
            "[]",
            ($"{school}/curso", $"""
                slug: curso-{Guid.NewGuid():N}
                school: {school}
                order: 1
                title: Curso
                summary: Resumen
                level: Beginner
                status: Published
                """));

        var ex = await Assert.ThrowsAsync<ContentValidationException>(() => ImportAsync(dir));

        Assert.Contains(ex.Errors, e => e.Contains("estimatedMinutes", StringComparison.Ordinal));
        Assert.Contains(ex.Errors, e => e.Contains("objetivos", StringComparison.Ordinal));
        Assert.Contains(ex.Errors, e => e.Contains("lastReviewedAt", StringComparison.Ordinal));
        Assert.Contains(ex.Errors, e => e.Contains("lecciones", StringComparison.Ordinal));
    }

    [Fact]
    public async Task Malformed_yaml_reports_the_file_and_line()
    {
        var dir = TempContent("- slug: [sin cerrar", "[]");

        var ex = await Assert.ThrowsAsync<ContentValidationException>(() => ImportAsync(dir));

        Assert.Contains(ex.Errors, e => e.StartsWith("escuelas.yml (línea", StringComparison.Ordinal));
    }

    public void Dispose()
    {
        _factory.Dispose();
        foreach (var dir in _tempDirs.Where(Directory.Exists))
        {
            Directory.Delete(dir, recursive: true);
        }
    }
}
