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

internal sealed record ImportResult(int Schools, int Technologies, int Courses, int Lessons);

/// <summary>Curso leído de content/ con las lecciones de cada módulo (misma posición que <c>Doc.Modules</c>).</summary>
internal sealed record CourseSource(string Path, CourseDocument Doc, List<List<LessonDocument>> ModuleLessons);

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

        var courses = new List<CourseSource>();
        foreach (var file in courseFiles.Order(StringComparer.Ordinal))
        {
            var relative = System.IO.Path.GetRelativePath(contentPath, file).Replace('\\', '/');
            if (Load<CourseDocument>(contentPath, relative, errors) is { } course)
            {
                courses.Add(new CourseSource(relative, course, LoadLessons(contentPath, relative, course, errors)));
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
        var finalLessonOrder = await UpsertCoursesAsync(courses, schoolEntities, technologyEntities, cancellationToken);

        // Dos pasos: las lecciones se guardan primero con posiciones provisionales (negativas) para que
        // reordenar o mover lecciones entre módulos no choque con el índice único (módulo, posición).
        await db.SaveChangesAsync(cancellationToken);
        foreach (var (lesson, order) in finalLessonOrder)
        {
            lesson.SortOrder = order;
        }

        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        var lessonCount = courses.Sum(c => c.ModuleLessons.Sum(m => m.Count));
        var result = new ImportResult(schools.Count, technologies.Count, courses.Count, lessonCount);
        LogImported(logger, result.Schools, result.Technologies, result.Courses, result.Lessons);
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

    private static List<List<LessonDocument>> LoadLessons(string contentPath, string coursePath, CourseDocument course, List<string> errors)
    {
        var courseDir = System.IO.Path.GetDirectoryName(System.IO.Path.Combine(contentPath, coursePath))!;
        var result = new List<List<LessonDocument>>();

        foreach (var module in course.Modules)
        {
            var lessons = new List<LessonDocument>();
            result.Add(lessons);
            if (string.IsNullOrWhiteSpace(module.Lessons))
            {
                continue;
            }

            var dir = System.IO.Path.GetFullPath(System.IO.Path.Combine(courseDir, module.Lessons));
            if (!dir.StartsWith(courseDir, StringComparison.Ordinal) || !Directory.Exists(dir))
            {
                errors.Add($"{coursePath}: la carpeta de lecciones «{module.Lessons}» no existe dentro del curso.");
                continue;
            }

            // El orden de las lecciones es el de los nombres de archivo (01-…, 02-…).
            foreach (var file in Directory.GetFiles(dir, "*.md").Order(StringComparer.Ordinal))
            {
                var relative = System.IO.Path.GetRelativePath(contentPath, file).Replace('\\', '/');
                if (LessonParser.Parse(relative, File.ReadAllText(file), errors) is { } lesson)
                {
                    lessons.Add(lesson);
                }
            }

            if (lessons.Count == 0)
            {
                errors.Add($"{coursePath}: la carpeta «{module.Lessons}» no contiene lecciones (.md).");
            }
        }

        return result;
    }

    private static void Validate(
        List<SchoolDocument> schools,
        List<TechnologyDocument> technologies,
        List<CourseSource> courses,
        List<string> errors)
    {
        CheckUniqueSlugs("escuelas.yml", schools.Select(s => s.Slug), errors);
        CheckUniqueSlugs("tecnologias.yml", technologies.Select(t => t.Slug), errors);
        CheckUniqueSlugs("cursos", courses.Select(c => c.Doc.Slug), errors);

        foreach (var course in courses)
        {
            var lessons = course.ModuleLessons.SelectMany(m => m).ToList();
            CheckUniqueSlugs($"{course.Path} (lecciones)", lessons.Select(l => l.Meta.Slug), errors);
            foreach (var lesson in lessons)
            {
                CheckSlug(lesson.Path, lesson.Meta.Slug, errors);
            }
        }

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

        foreach (var (path, course, moduleLessons) in courses)
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
                ValidatePublishable(path, course, moduleLessons, errors);
            }
        }
    }

    private static void ValidatePublishable(string path, CourseDocument course, List<List<LessonDocument>> moduleLessons, List<string> errors)
    {
        if (course.Objectives.Count == 0)
        {
            errors.Add($"{path}: un curso publicado necesita objetivos de aprendizaje.");
        }

        if (course.LastReviewedAt is null)
        {
            errors.Add($"{path}: un curso publicado necesita lastReviewedAt (fecha de la última revisión).");
        }

        // Se puede publicar con módulos aún en preparación (el temario lo indica), pero no sin lecciones.
        // Si no se indica estimatedMinutes, la duración es la suma de las lecciones publicadas.
        if (moduleLessons.All(m => m.Count == 0))
        {
            errors.Add($"{path}: un curso publicado necesita al menos un módulo con lecciones.");
        }
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

    private async Task<List<(Lesson Lesson, int Order)>> UpsertCoursesAsync(
        List<CourseSource> documents,
        Dictionary<string, School> schools,
        Dictionary<string, Technology> technologies,
        CancellationToken ct)
    {
        var slugs = documents.Select(d => d.Doc.Slug).ToList();
        var existing = await db.Courses
            .Include(c => c.Technologies)
            .Include(c => c.Modules).ThenInclude(m => m.Lessons)
            .Where(c => slugs.Contains(c.Slug))
            .AsSplitQuery()
            .ToDictionaryAsync(c => c.Slug, StringComparer.Ordinal, ct);

        var finalLessonOrder = new List<(Lesson, int)>();

        foreach (var (path, doc, moduleLessons) in documents)
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
            course.EstimatedMinutes = doc.EstimatedMinutes
                ?? (status == ContentStatus.Published ? moduleLessons.Sum(m => m.Sum(l => l.Meta.EstimatedMinutes)) : null);
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

            SyncModules(course, doc.Modules, moduleLessons, finalLessonOrder);
        }

        return finalLessonOrder;
    }

    /// <summary>
    /// Sincroniza los módulos por posición: actualiza los existentes, añade los nuevos y elimina los sobrantes.
    /// </summary>
    private void SyncModules(
        Course course,
        List<ModuleDocument> documents,
        List<List<LessonDocument>> moduleLessons,
        List<(Lesson, int)> finalLessonOrder)
    {
        var current = course.Modules.OrderBy(m => m.SortOrder).ToList();
        var existingLessons = current.SelectMany(m => m.Lessons).ToDictionary(l => l.Slug, StringComparer.Ordinal);
        var keptLessons = new HashSet<string>(StringComparer.Ordinal);
        var provisional = 0;

        for (var i = 0; i < documents.Count; i++)
        {
            var module = i < current.Count ? current[i] : null;
            if (module is null)
            {
                // Add explícito: con el Id ya generado en el cliente (UUID v7), EF supondría que la
                // entidad existe y haría un UPDATE en lugar de un INSERT.
                module = new CourseModule { Title = documents[i].Title };
                course.Modules.Add(module);
                db.CourseModules.Add(module);
            }

            module.Title = documents[i].Title.Trim();
            module.Summary = documents[i].Summary.Trim();
            module.SortOrder = i + 1;

            for (var j = 0; j < moduleLessons[i].Count; j++)
            {
                var doc = moduleLessons[i][j];
                if (!existingLessons.TryGetValue(doc.Meta.Slug, out var lesson))
                {
                    lesson = new Lesson { Slug = doc.Meta.Slug, Title = doc.Meta.Title, BodyMarkdown = doc.Body };
                    db.Lessons.Add(lesson);
                }

                if (lesson.Module != module)
                {
                    lesson.Module?.Lessons.Remove(lesson);
                    module.Lessons.Add(lesson);
                }

                lesson.Title = doc.Meta.Title.Trim();
                lesson.EstimatedMinutes = doc.Meta.EstimatedMinutes;
                lesson.BodyMarkdown = doc.Body;
                lesson.PracticeActivityMarkdown = doc.PracticeActivity;
                lesson.CheckCriteriaMarkdown = doc.CheckCriteria;
                lesson.VideoUrl = doc.Meta.VideoUrl is null ? null : new Uri(doc.Meta.VideoUrl);
                lesson.TranscriptMarkdown = doc.Transcript;
                lesson.SortOrder = --provisional;
                finalLessonOrder.Add((lesson, j + 1));
                keptLessons.Add(doc.Meta.Slug);
            }
        }

        foreach (var removed in existingLessons.Values.Where(l => !keptLessons.Contains(l.Slug)))
        {
            db.Lessons.Remove(removed);
        }

        foreach (var extra in current.Skip(documents.Count))
        {
            db.CourseModules.Remove(extra);
        }
    }

    [GeneratedRegex("^[a-z0-9]+(-[a-z0-9]+)*$")]
    private static partial Regex SlugPattern();

    [LoggerMessage(Level = LogLevel.Information, Message = "Contenido importado: {Schools} escuelas, {Technologies} tecnologías, {Courses} cursos, {Lessons} lecciones")]
    private static partial void LogImported(ILogger logger, int schools, int technologies, int courses, int lessons);
}
