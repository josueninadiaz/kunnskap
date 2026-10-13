using Academy.Api.Infrastructure.Persistence;
using Academy.Api.Modules.Catalog.Domain;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace Academy.Api.Modules.Catalog;

internal sealed record SchoolSummary(string Slug, string Name, string Description, int PublishedCourses, int CoursesInDevelopment);

internal sealed record TechnologySummary(string Slug, string Name);

internal sealed record CatalogFacets(
    IReadOnlyList<SchoolSummary> Schools,
    IReadOnlyList<TechnologySummary> Technologies,
    IReadOnlyList<CourseLevel> Levels);

internal sealed record SchoolRef(string Slug, string Name);

internal sealed record CourseListItem(
    string Slug,
    string Title,
    string Summary,
    SchoolRef School,
    CourseLevel Level,
    ContentStatus Status,
    int? EstimatedMinutes,
    IReadOnlyList<TechnologySummary> Technologies,
    int ModuleCount,
    bool ContentComplete);

internal sealed record PagedResponse<T>(IReadOnlyList<T> Items, int Page, int PageSize, int TotalCount);

internal sealed record LessonOutline(string Slug, string Title, int EstimatedMinutes);

internal sealed record QuizOutline(string Slug, string Title, int QuestionCount);

internal sealed record ModuleOutline(string Title, string Summary, IReadOnlyList<LessonOutline> Lessons, QuizOutline? Quiz);

internal sealed record CourseDetail(
    string Slug,
    string Title,
    string Summary,
    string DescriptionMarkdown,
    SchoolRef School,
    CourseLevel Level,
    ContentStatus Status,
    int? EstimatedMinutes,
    string Language,
    string LicenseSpdx,
    IReadOnlyList<string> LearningObjectives,
    IReadOnlyList<string> Prerequisites,
    IReadOnlyList<string> Authors,
    IReadOnlyList<string> SoftwareVersions,
    DateTimeOffset? LastReviewedAt,
    IReadOnlyList<TechnologySummary> Technologies,
    IReadOnlyList<ModuleOutline> Modules,
    bool ContentComplete);

internal sealed record LessonLink(string Slug, string Title);

internal sealed record LessonView(
    string CourseSlug,
    string CourseTitle,
    int ModuleNumber,
    string ModuleTitle,
    string Slug,
    string Title,
    int EstimatedMinutes,
    string BodyMarkdown,
    string PracticeActivityMarkdown,
    string CheckCriteriaMarkdown,
    Uri? VideoUrl,
    string? TranscriptMarkdown,
    int Position,
    int TotalLessons,
    LessonLink? Previous,
    LessonLink? Next);

/// <summary>
/// Catálogo público. Solo muestra cursos publicados o en preparación; los borradores y archivados
/// no existen para el público (404).
/// </summary>
internal static class CatalogEndpoints
{
    public const int DefaultPageSize = 20;
    public const int MaxPageSize = 50;

    private static readonly ContentStatus[] VisibleStatuses = [ContentStatus.Published, ContentStatus.InDevelopment];

    public static IEndpointRouteBuilder MapCatalogEndpoints(this IEndpointRouteBuilder api)
    {
        var group = api.MapGroup("/catalog").WithTags("Catálogo");

        group.MapGet("/facets", GetFacetsAsync)
            .WithSummary("Escuelas (con número de cursos), tecnologías y niveles para los filtros del catálogo.");

        group.MapGet("/courses", SearchCoursesAsync)
            .WithSummary("Cursos visibles con búsqueda (sin distinguir tildes), filtros y paginación.");

        group.MapGet("/courses/{slug}", GetCourseAsync)
            .WithSummary("Detalle de un curso: objetivos, requisitos y temario.");

        group.MapGet("/courses/{slug}/lessons/{lessonSlug}", GetLessonAsync)
            .WithSummary("Contenido de una lección de un curso publicado, con enlaces a la anterior y la siguiente. Es público: no requiere cuenta.");

        return api;
    }

    private static async Task<Ok<CatalogFacets>> GetFacetsAsync(AcademyDbContext db, CancellationToken ct)
    {
        var schools = await db.Schools
            .AsNoTracking()
            .OrderBy(s => s.SortOrder)
            .Select(s => new SchoolSummary(
                s.Slug,
                s.Name,
                s.Description,
                s.Courses.Count(c => c.Status == ContentStatus.Published),
                s.Courses.Count(c => c.Status == ContentStatus.InDevelopment)))
            .ToListAsync(ct);

        // Solo tecnologías usadas por algún curso visible, para no ofrecer filtros que no devuelven nada.
        var technologies = await db.Technologies
            .AsNoTracking()
            .Where(t => t.Courses.Any(c => VisibleStatuses.Contains(c.Status)))
            .OrderBy(t => t.Name)
            .Select(t => new TechnologySummary(t.Slug, t.Name))
            .ToListAsync(ct);

        return TypedResults.Ok(new CatalogFacets(schools, technologies, Enum.GetValues<CourseLevel>()));
    }

    private static async Task<Results<Ok<PagedResponse<CourseListItem>>, ValidationProblem>> SearchCoursesAsync(
        AcademyDbContext db,
        CancellationToken ct,
        string? q = null,
        string? school = null,
        string? level = null,
        string? technology = null,
        string? duration = null,
        string? status = null,
        int page = 1,
        int pageSize = DefaultPageSize)
    {
        var errors = new Dictionary<string, string[]>();
        var levelFilter = ParseEnum<CourseLevel>(level, "level", errors);
        var statusFilter = ParseEnum<ContentStatus>(status, "status", errors);
        var durationRange = CatalogQuery.ParseDuration(duration, errors);

        if (statusFilter is ContentStatus.Draft or ContentStatus.Archived)
        {
            errors["status"] = ["Solo se pueden filtrar cursos publicados o en preparación."];
        }

        if (page < 1)
        {
            errors["page"] = ["La página debe ser 1 o mayor."];
        }

        if (pageSize is < 1 or > MaxPageSize)
        {
            errors["pageSize"] = [$"El tamaño de página debe estar entre 1 y {MaxPageSize}."];
        }

        if (errors.Count > 0)
        {
            return TypedResults.ValidationProblem(errors);
        }

        var query = db.Courses.AsNoTracking().Where(c => VisibleStatuses.Contains(c.Status));

        if (!string.IsNullOrWhiteSpace(q))
        {
            var pattern = CatalogQuery.ContainsPattern(q.Trim());
            query = query.Where(c =>
                EF.Functions.ILike(EF.Functions.Unaccent(c.Title), EF.Functions.Unaccent(pattern)) ||
                EF.Functions.ILike(EF.Functions.Unaccent(c.Summary), EF.Functions.Unaccent(pattern)) ||
                EF.Functions.ILike(EF.Functions.Unaccent(c.DescriptionMarkdown), EF.Functions.Unaccent(pattern)));
        }

        if (!string.IsNullOrWhiteSpace(school))
        {
            query = query.Where(c => c.School!.Slug == school);
        }

        if (levelFilter is { } lvl)
        {
            query = query.Where(c => c.Level == lvl);
        }

        if (statusFilter is { } st)
        {
            query = query.Where(c => c.Status == st);
        }

        if (!string.IsNullOrWhiteSpace(technology))
        {
            query = query.Where(c => c.Technologies.Any(t => t.Slug == technology));
        }

        if (durationRange is var (min, max))
        {
            query = query.Where(c => c.EstimatedMinutes != null && c.EstimatedMinutes >= min && c.EstimatedMinutes <= max);
        }

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderBy(c => c.School!.SortOrder)
            .ThenBy(c => c.SortOrder)
            .ThenBy(c => c.Title)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new CourseListItem(
                c.Slug,
                c.Title,
                c.Summary,
                new SchoolRef(c.School!.Slug, c.School.Name),
                c.Level,
                c.Status,
                c.EstimatedMinutes,
                c.Technologies.OrderBy(t => t.Name).Select(t => new TechnologySummary(t.Slug, t.Name)).ToList(),
                c.Modules.Count,
                c.Modules.Count > 0 && c.Modules.All(m => m.Lessons.Count > 0)))
            .ToListAsync(ct);

        return TypedResults.Ok(new PagedResponse<CourseListItem>(items, page, pageSize, total));
    }

    private static async Task<Results<Ok<CourseDetail>, NotFound>> GetCourseAsync(string slug, AcademyDbContext db, CancellationToken ct)
    {
        var course = await db.Courses
            .AsNoTracking()
            .Where(c => c.Slug == slug && VisibleStatuses.Contains(c.Status))
            .Select(c => new CourseDetail(
                c.Slug,
                c.Title,
                c.Summary,
                c.DescriptionMarkdown,
                new SchoolRef(c.School!.Slug, c.School.Name),
                c.Level,
                c.Status,
                c.EstimatedMinutes,
                c.Language,
                c.LicenseSpdx,
                c.LearningObjectives,
                c.Prerequisites,
                c.Authors,
                c.SoftwareVersions,
                c.LastReviewedAt,
                c.Technologies.OrderBy(t => t.Name).Select(t => new TechnologySummary(t.Slug, t.Name)).ToList(),
                c.Modules
                    .OrderBy(m => m.SortOrder)
                    .Select(m => new ModuleOutline(
                        m.Title,
                        m.Summary,
                        m.Lessons.OrderBy(l => l.SortOrder).Select(l => new LessonOutline(l.Slug, l.Title, l.EstimatedMinutes)).ToList(),
                        db.Quizzes
                            .Where(q => q.ModuleId == m.Id)
                            .Select(q => new QuizOutline(q.Slug, q.Title, q.Questions.Count))
                            .FirstOrDefault()))
                    .ToList(),
                c.Modules.Count > 0 && c.Modules.All(m => m.Lessons.Count > 0)))
            .SingleOrDefaultAsync(ct);

        return course is null ? TypedResults.NotFound() : TypedResults.Ok(course);
    }

    private static async Task<Results<Ok<LessonView>, NotFound>> GetLessonAsync(
        string slug,
        string lessonSlug,
        AcademyDbContext db,
        CancellationToken ct)
    {
        // Las lecciones solo son visibles en cursos publicados.
        var outline = await db.Lessons
            .AsNoTracking()
            .Where(l => l.Module!.Course!.Slug == slug && l.Module.Course.Status == ContentStatus.Published)
            .OrderBy(l => l.Module!.SortOrder)
            .ThenBy(l => l.SortOrder)
            .Select(l => new { l.Id, l.Slug, l.Title })
            .ToListAsync(ct);

        var index = outline.FindIndex(l => l.Slug == lessonSlug);
        if (index < 0)
        {
            return TypedResults.NotFound();
        }

        var id = outline[index].Id;
        var previous = index > 0 ? new LessonLink(outline[index - 1].Slug, outline[index - 1].Title) : null;
        var next = index < outline.Count - 1 ? new LessonLink(outline[index + 1].Slug, outline[index + 1].Title) : null;

        var lesson = await db.Lessons
            .AsNoTracking()
            .Where(l => l.Id == id)
            .Select(l => new LessonView(
                l.Module!.Course!.Slug,
                l.Module.Course.Title,
                l.Module.SortOrder,
                l.Module.Title,
                l.Slug,
                l.Title,
                l.EstimatedMinutes,
                l.BodyMarkdown,
                l.PracticeActivityMarkdown,
                l.CheckCriteriaMarkdown,
                l.VideoUrl,
                l.TranscriptMarkdown,
                index + 1,
                outline.Count,
                previous,
                next))
            .SingleAsync(ct);

        return TypedResults.Ok(lesson);
    }

    private static TEnum? ParseEnum<TEnum>(string? value, string field, Dictionary<string, string[]> errors)
        where TEnum : struct, Enum
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        if (Enum.TryParse<TEnum>(value, ignoreCase: true, out var parsed) && Enum.IsDefined(parsed))
        {
            return parsed;
        }

        errors[field] = [$"Valor no válido. Opciones: {string.Join(", ", Enum.GetNames<TEnum>())}."];
        return null;
    }
}
