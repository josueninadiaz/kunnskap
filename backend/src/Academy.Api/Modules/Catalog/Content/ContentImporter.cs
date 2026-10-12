using System.Text.RegularExpressions;
using Academy.Api.Infrastructure.Persistence;
using Academy.Api.Modules.Catalog.Domain;
using Microsoft.EntityFrameworkCore;
using YamlDotNet.Core;
using YamlDotNet.Serialization;
using YamlDotNet.Serialization.NamingConventions;

namespace Academy.Api.Modules.Catalog.Content;

internal sealed class ContentOptions
{
    public const string SectionName = "Content";

    /// <summary>Carpeta content/ (relativa a la raíz de la API o absoluta).</summary>
    public string Path { get; init; } = "../../../content";

    /// <summary>Importar al arrancar (solo en desarrollo).</summary>
    public bool ImportOnStartup { get; init; }
}

internal sealed record ImportResult(int Schools, int Technologies, int Courses);

/// <summary>Errores de contenido, todos a la vez, para corregirlos en una sola pasada.</summary>
internal sealed class ContentValidationException(IReadOnlyList<string> errors)
    : Exception("El contenido tiene errores:" + Environment.NewLine + string.Join(Environment.NewLine, errors.Select(e => "  - " + e)))
{
    public IReadOnlyList<string> Errors { get; } = errors;
}

/// <summary>
/// Importa content/ (YAML versionado en el repositorio) a PostgreSQL. Es idempotente: usa el slug como
/// clave estable, actualiza lo que cambió y nunca borra cursos (podrían tener inscripciones).
/// Ver ADR 0003.
/// </summary>
internal sealed partial class ContentImporter(AcademyDbContext db, TimeProvider timeProvider, ILogger<ContentImporter> logger)
{
    private static readonly IDeserializer Yaml = new DeserializerBuilder()
        .WithNamingConvention(CamelCaseNamingConvention.Instance)
        .Build();

    public async Task<ImportResult> ImportAsync(string contentPath, CancellationToken cancellationToken = default)
    {
        var errors = new List<string>();
        var schools = Load<List<SchoolDocument>>(contentPath, "escuelas.yml", errors) ?? [];
        var technologies = Load<List<TechnologyDocument>>(contentPath, "tecnologias.yml", errors) ?? [];

        var courseFiles = Directory.Exists(System.IO.Path.Combine(contentPath, "cursos"))
            ? Directory.GetFiles(System.IO.Path.Combine(contentPath, "cursos"), "curso.yml", SearchOption.AllDirectories)
            : [];

        var courses = new List<(string Path, CourseDocument Doc)>();
        foreach (var file in courseFiles.Order(StringComparer.Ordinal))
        {
            var relative = System.IO.Path.GetRelativePath(contentPath, file).Replace('\\', '/');
            if (Load<CourseDocument>(contentPath, relative, errors) is { } course)
            {
                courses.Add((relative, course));
            }
        }

        Validate(schools, technologies, courses, errors);
        if (errors.Count > 0)
        {
            throw new ContentValidationException(errors);
        }

        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);

        var schoolEntities = await UpsertSchoolsAsync(schools, cancellationToken);
        var technologyEntities = await UpsertTechnologiesAsync(technologies, cancellationToken);
        await UpsertCoursesAsync(courses, schoolEntities, technologyEntities, cancellationToken);

        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        var result = new ImportResult(schools.Count, technologies.Count, courses.Count);
        LogImported(logger, result.Schools, result.Technologies, result.Courses);
        return result;
    }

    private static T? Load<T>(string contentPath, string relativePath, List<string> errors)
        where T : class
    {
        var file = System.IO.Path.Combine(contentPath, relativePath);
        if (!File.Exists(file))
        {
            errors.Add($"{relativePath}: no existe.");
            return null;
        }

        try
        {
            var value = Yaml.Deserialize<T>(File.ReadAllText(file));
            if (value is null)
            {
                errors.Add($"{relativePath}: el archivo está vacío.");
            }

            return value;
        }
        catch (YamlException ex)
        {
            errors.Add($"{relativePath} (línea {ex.Start.Line}): {ex.InnerException?.Message ?? ex.Message}");
            return null;
        }
    }

    private static void Validate(
        List<SchoolDocument> schools,
        List<TechnologyDocument> technologies,
        List<(string Path, CourseDocument Doc)> courses,
        List<string> errors)
    {
        CheckUniqueSlugs("escuelas.yml", schools.Select(s => s.Slug), errors);
        CheckUniqueSlugs("tecnologias.yml", technologies.Select(t => t.Slug), errors);
        CheckUniqueSlugs("cursos", courses.Select(c => c.Doc.Slug), errors);

        foreach (var school in schools)
        {
            CheckSlug("escuelas.yml", school.Slug, errors);
            CheckText("escuelas.yml", $"name de «{school.Slug}»", school.Name, 160, errors);
            CheckText("escuelas.yml", $"description de «{school.Slug}»", school.Description, 2000, errors);
        }

        foreach (var technology in technologies)
        {
            CheckSlug("tecnologias.yml", technology.Slug, errors);
            CheckText("tecnologias.yml", $"name de «{technology.Slug}»", technology.Name, 80, errors);
        }

        var schoolSlugs = schools.Select(s => s.Slug).ToHashSet(StringComparer.Ordinal);
        var technologySlugs = technologies.Select(t => t.Slug).ToHashSet(StringComparer.Ordinal);

        foreach (var (path, course) in courses)
        {
            CheckSlug(path, course.Slug, errors);
            CheckText(path, "title", course.Title, 200, errors);
            CheckText(path, "summary", course.Summary, 500, errors);

            if (!schoolSlugs.Contains(course.School))
            {
                errors.Add($"{path}: la escuela «{course.School}» no existe en escuelas.yml.");
            }

            foreach (var tech in course.Technologies.Where(t => !technologySlugs.Contains(t)))
            {
                errors.Add($"{path}: la tecnología «{tech}» no existe en tecnologias.yml.");
            }

            if (!Enum.TryParse<CourseLevel>(course.Level, ignoreCase: false, out _))
            {
                errors.Add($"{path}: level debe ser Beginner, Intermediate o Advanced.");
            }

            if (!Enum.TryParse<ContentStatus>(course.Status, ignoreCase: false, out var status) || status == ContentStatus.Archived)
            {
                errors.Add($"{path}: status debe ser Draft, InDevelopment o Published.");
            }

            if (course.EstimatedMinutes is <= 0)
            {
                errors.Add($"{path}: estimatedMinutes debe ser mayor que 0.");
            }

            for (var i = 0; i < course.Modules.Count; i++)
            {
                CheckText(path, $"modules[{i}].title", course.Modules[i].Title, 200, errors);
            }

            if (status == ContentStatus.Published)
            {
                ValidatePublishable(path, course, errors);
            }
        }
    }

    private static void ValidatePublishable(string path, CourseDocument course, List<string> errors)
    {
        if (course.EstimatedMinutes is null)
        {
            errors.Add($"{path}: un curso publicado necesita estimatedMinutes.");
        }

        if (course.Objectives.Count == 0)
        {
            errors.Add($"{path}: un curso publicado necesita objetivos de aprendizaje.");
        }

        if (course.LastReviewedAt is null)
        {
            errors.Add($"{path}: un curso publicado necesita lastReviewedAt (fecha de la última revisión).");
        }

        // Las lecciones se importarán desde Markdown en la fase 3. Hasta entonces, ningún curso del
        // repositorio tiene lecciones y por tanto ninguno puede publicarse.
        errors.Add($"{path}: un curso publicado necesita al menos un módulo con lecciones.");
    }

    private static void CheckUniqueSlugs(string where, IEnumerable<string> slugs, List<string> errors)
    {
        foreach (var duplicate in slugs.GroupBy(s => s, StringComparer.Ordinal).Where(g => g.Count() > 1))
        {
            errors.Add($"{where}: el slug «{duplicate.Key}» está repetido.");
        }
    }

    private static void CheckSlug(string path, string slug, List<string> errors)
    {
        if (!SlugPattern().IsMatch(slug) || slug.Length > 120)
        {
            errors.Add($"{path}: el slug «{slug}» solo puede tener minúsculas sin tildes, números y guiones.");
        }
    }

    private static void CheckText(string path, string field, string value, int maxLength, List<string> errors)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            errors.Add($"{path}: falta {field}.");
        }
        else if (value.Length > maxLength)
        {
            errors.Add($"{path}: {field} supera los {maxLength} caracteres.");
        }
    }

    private async Task<Dictionary<string, School>> UpsertSchoolsAsync(List<SchoolDocument> documents, CancellationToken ct)
    {
        var existing = await db.Schools.ToDictionaryAsync(s => s.Slug, StringComparer.Ordinal, ct);
        foreach (var doc in documents)
        {
            if (!existing.TryGetValue(doc.Slug, out var school))
            {
                school = new School { Slug = doc.Slug, Name = doc.Name, Description = doc.Description };
                db.Schools.Add(school);
                existing[doc.Slug] = school;
            }

            school.Name = doc.Name.Trim();
            school.Description = doc.Description.Trim();
            school.SortOrder = doc.Order;
        }

        return existing;
    }

    private async Task<Dictionary<string, Technology>> UpsertTechnologiesAsync(List<TechnologyDocument> documents, CancellationToken ct)
    {
        var existing = await db.Technologies.ToDictionaryAsync(t => t.Slug, StringComparer.Ordinal, ct);
        foreach (var doc in documents)
        {
            if (!existing.TryGetValue(doc.Slug, out var technology))
            {
                technology = new Technology { Slug = doc.Slug, Name = doc.Name };
                db.Technologies.Add(technology);
                existing[doc.Slug] = technology;
            }

            technology.Name = doc.Name.Trim();
        }

        return existing;
    }

    private async Task UpsertCoursesAsync(
        List<(string Path, CourseDocument Doc)> documents,
        Dictionary<string, School> schools,
        Dictionary<string, Technology> technologies,
        CancellationToken ct)
    {
        var slugs = documents.Select(d => d.Doc.Slug).ToList();
        var existing = await db.Courses
            .Include(c => c.Technologies)
            .Include(c => c.Modules)
            .Where(c => slugs.Contains(c.Slug))
            .ToDictionaryAsync(c => c.Slug, StringComparer.Ordinal, ct);

        foreach (var (path, doc) in documents)
        {
            if (!existing.TryGetValue(doc.Slug, out var course))
            {
                course = new Course { Slug = doc.Slug, Title = doc.Title, Summary = doc.Summary, DescriptionMarkdown = string.Empty };
                db.Courses.Add(course);
            }

            var status = Enum.Parse<ContentStatus>(doc.Status);
            course.School = schools[doc.School];
            course.SortOrder = doc.Order;
            course.Title = doc.Title.Trim();
            course.Summary = doc.Summary.Trim();
            course.DescriptionMarkdown = (doc.Description ?? doc.Summary).Trim();
            course.Level = Enum.Parse<CourseLevel>(doc.Level);
            course.Status = status;
            course.EstimatedMinutes = doc.EstimatedMinutes;
            course.Language = doc.Language;
            course.LearningObjectives = [.. doc.Objectives.Select(o => o.Trim())];
            course.Prerequisites = [.. doc.Prerequisites.Select(p => p.Trim())];
            course.Authors = [.. doc.Authors.Select(a => a.Trim())];
            course.SoftwareVersions = [.. doc.SoftwareVersions.Select(v => v.Trim())];
            course.LastReviewedAt = doc.LastReviewedAt?.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            course.SourcePath = "content/" + path;

            if (status == ContentStatus.Published)
            {
                course.PublishedAt ??= timeProvider.GetUtcNow();
            }

            course.Technologies.Clear();
            course.Technologies.AddRange(doc.Technologies.Select(t => technologies[t]));

            SyncModules(course, doc.Modules);
        }
    }

    /// <summary>
    /// Sincroniza los módulos por posición: actualiza los existentes, añade los nuevos y elimina los sobrantes.
    /// </summary>
    private void SyncModules(Course course, List<ModuleDocument> documents)
    {
        var current = course.Modules.OrderBy(m => m.SortOrder).ToList();

        for (var i = 0; i < documents.Count; i++)
        {
            var module = i < current.Count ? current[i] : null;
            if (module is null)
            {
                module = new CourseModule { Title = documents[i].Title };
                course.Modules.Add(module);
            }

            module.Title = documents[i].Title.Trim();
            module.Summary = documents[i].Summary.Trim();
            module.SortOrder = i + 1;
        }

        foreach (var extra in current.Skip(documents.Count))
        {
            db.CourseModules.Remove(extra);
        }
    }

    [GeneratedRegex("^[a-z0-9]+(-[a-z0-9]+)*$")]
    private static partial Regex SlugPattern();

    [LoggerMessage(Level = LogLevel.Information, Message = "Contenido importado: {Schools} escuelas, {Technologies} tecnologías, {Courses} cursos")]
    private static partial void LogImported(ILogger logger, int schools, int technologies, int courses);
}
