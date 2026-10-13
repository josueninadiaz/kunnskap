using System.Security.Claims;
using Academy.Api.Infrastructure.Persistence;
using Academy.Api.Modules.Catalog.Domain;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Academy.Api.Modules.Learning;

internal sealed record CourseProgressResponse(
    bool Enrolled,
    DateTimeOffset? EnrolledAt,
    DateTimeOffset? CompletedAt,
    string? LastLessonSlug,
    IReadOnlyList<string> CompletedLessonSlugs,
    int TotalLessons,
    IReadOnlyList<string> PassedQuizSlugs,
    int TotalQuizzes);

/// <summary>
/// Inscripción gratuita y progreso. Leer las lecciones es público; inscribirse sirve para guardar
/// el progreso y continuar donde se dejó el curso. Todo requiere sesión iniciada.
/// </summary>
internal static class LearningEndpoints
{
    public static IEndpointRouteBuilder MapLearningEndpoints(this IEndpointRouteBuilder api)
    {
        var group = api.MapGroup("/learning/courses/{slug}")
            .WithTags("Aprendizaje")
            .RequireAuthorization();

        group.MapGet("/progress", GetProgressAsync)
            .WithSummary("Progreso de la persona en el curso (inscripción, lecciones completadas y última lección).");

        group.MapPost("/enrollment", EnrollAsync)
            .WithSummary("Inscripción gratuita en un curso publicado. Repetirla no tiene efecto.");

        group.MapPut("/lessons/{lessonSlug}/visit", RecordVisitAsync)
            .WithSummary("Registra que se abrió una lección: es el punto desde el que continuar.");

        group.MapPut("/lessons/{lessonSlug}/completion", (string slug, string lessonSlug, ClaimsPrincipal user, AcademyDbContext db, TimeProvider time, CancellationToken ct) =>
                SetCompletionAsync(slug, lessonSlug, completed: true, user, db, time, ct))
            .WithSummary("Marca una lección como completada.");

        group.MapDelete("/lessons/{lessonSlug}/completion", (string slug, string lessonSlug, ClaimsPrincipal user, AcademyDbContext db, TimeProvider time, CancellationToken ct) =>
                SetCompletionAsync(slug, lessonSlug, completed: false, user, db, time, ct))
            .WithSummary("Desmarca una lección completada.");

        return api;
    }

    private static Guid UserId(ClaimsPrincipal user) =>
        Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private static IQueryable<Course> PublishedCourse(AcademyDbContext db, string slug) =>
        db.Courses.Where(c => c.Slug == slug && c.Status == ContentStatus.Published);

    private static async Task<Results<Ok<CourseProgressResponse>, NotFound>> GetProgressAsync(
        string slug, ClaimsPrincipal user, AcademyDbContext db, CancellationToken ct)
    {
        var courseId = await PublishedCourse(db, slug).Select(c => (Guid?)c.Id).SingleOrDefaultAsync(ct);
        if (courseId is null)
        {
            return TypedResults.NotFound();
        }

        return TypedResults.Ok(await BuildProgressAsync(courseId.Value, UserId(user), db, ct));
    }

    private static async Task<CourseProgressResponse> BuildProgressAsync(Guid courseId, Guid userId, AcademyDbContext db, CancellationToken ct)
    {
        var enrollment = await db.Enrollments
            .AsNoTracking()
            .Where(e => e.CourseId == courseId && e.UserId == userId)
            .Select(e => new { e.EnrolledAt, e.CompletedAt, LastLessonSlug = e.LastLesson == null ? null : e.LastLesson.Slug })
            .SingleOrDefaultAsync(ct);

        var totalLessons = await db.Lessons.CountAsync(l => l.Module!.CourseId == courseId, ct);
        var totalQuizzes = await db.Quizzes.CountAsync(q => q.Module!.CourseId == courseId, ct);

        if (enrollment is null)
        {
            return new CourseProgressResponse(false, null, null, null, [], totalLessons, [], totalQuizzes);
        }

        var completed = await db.LessonProgress
            .AsNoTracking()
            .Where(p => p.UserId == userId && p.CompletedAt != null && p.Lesson!.Module!.CourseId == courseId)
            .OrderBy(p => p.Lesson!.Module!.SortOrder)
            .ThenBy(p => p.Lesson!.SortOrder)
            .Select(p => p.Lesson!.Slug)
            .ToListAsync(ct);

        var passedQuizzes = await db.QuizAttempts
            .AsNoTracking()
            .Where(a => a.UserId == userId && a.Passed && a.Quiz!.Module!.CourseId == courseId)
            .Select(a => a.Quiz!.Slug)
            .Distinct()
            .ToListAsync(ct);

        return new CourseProgressResponse(
            true, enrollment.EnrolledAt, enrollment.CompletedAt, enrollment.LastLessonSlug, completed, totalLessons, passedQuizzes, totalQuizzes);
    }

    private static async Task<Results<Ok<CourseProgressResponse>, NotFound, ProblemHttpResult>> EnrollAsync(
        string slug, ClaimsPrincipal user, AcademyDbContext db, TimeProvider time, CancellationToken ct)
    {
        var course = await db.Courses.Where(c => c.Slug == slug).Select(c => new { c.Id, c.Status }).SingleOrDefaultAsync(ct);
        if (course is null || course.Status is ContentStatus.Draft or ContentStatus.Archived)
        {
            return TypedResults.NotFound();
        }

        if (course.Status != ContentStatus.Published)
        {
            return TypedResults.Problem(
                statusCode: StatusCodes.Status409Conflict,
                title: "Este curso aún no admite inscripciones.",
                detail: "Está en preparación. Vuelve cuando esté publicado.");
        }

        var userId = UserId(user);
        if (!await db.Enrollments.AnyAsync(e => e.CourseId == course.Id && e.UserId == userId, ct))
        {
            var now = time.GetUtcNow();
            db.Enrollments.Add(new Enrollment { CourseId = course.Id, UserId = userId, EnrolledAt = now, LastActivityAt = now });
            try
            {
                await db.SaveChangesAsync(ct);
            }
            catch (DbUpdateException ex) when (IsUniqueViolation(ex))
            {
                // Dos peticiones simultáneas: la otra ya creó la inscripción, el resultado es el mismo.
                db.ChangeTracker.Clear();
            }
        }

        return TypedResults.Ok(await BuildProgressAsync(course.Id, userId, db, ct));
    }

    private sealed record LessonTarget(Guid CourseId, Guid LessonId, Enrollment? Enrollment);

    /// <summary>Lección de un curso publicado y la inscripción de la persona (si existe).</summary>
    private static async Task<LessonTarget?> FindLessonAsync(string slug, string lessonSlug, Guid userId, AcademyDbContext db, CancellationToken ct)
    {
        var lesson = await db.Lessons
            .Where(l => l.Slug == lessonSlug && l.Module!.Course!.Slug == slug && l.Module.Course.Status == ContentStatus.Published)
            .Select(l => new { l.Id, l.Module!.CourseId })
            .SingleOrDefaultAsync(ct);

        if (lesson is null)
        {
            return null;
        }

        var enrollment = await db.Enrollments.SingleOrDefaultAsync(e => e.CourseId == lesson.CourseId && e.UserId == userId, ct);
        return new LessonTarget(lesson.CourseId, lesson.Id, enrollment);
    }

    private static ProblemHttpResult NotEnrolled() =>
        TypedResults.Problem(
            statusCode: StatusCodes.Status409Conflict,
            title: "No estás inscrito en este curso.",
            detail: "Inscríbete gratis para guardar tu progreso.");

    private static async Task<Results<NoContent, NotFound, ProblemHttpResult>> RecordVisitAsync(
        string slug, string lessonSlug, ClaimsPrincipal user, AcademyDbContext db, TimeProvider time, CancellationToken ct)
    {
        var userId = UserId(user);
        if (await FindLessonAsync(slug, lessonSlug, userId, db, ct) is not { } target)
        {
            return TypedResults.NotFound();
        }

        if (target.Enrollment is null)
        {
            return NotEnrolled();
        }

        var now = time.GetUtcNow();
        target.Enrollment.LastLessonId = target.LessonId;
        target.Enrollment.LastActivityAt = now;
        await GetOrCreateProgressAsync(userId, target.LessonId, now, db, ct);
        await SaveIgnoringDuplicateProgressAsync(db, ct);

        return TypedResults.NoContent();
    }

    private static async Task<Results<Ok<CourseProgressResponse>, NotFound, ProblemHttpResult>> SetCompletionAsync(
        string slug, string lessonSlug, bool completed, ClaimsPrincipal user, AcademyDbContext db, TimeProvider time, CancellationToken ct)
    {
        var userId = UserId(user);
        if (await FindLessonAsync(slug, lessonSlug, userId, db, ct) is not { } target)
        {
            return TypedResults.NotFound();
        }

        if (target.Enrollment is null)
        {
            return NotEnrolled();
        }

        var now = time.GetUtcNow();
        var progress = await GetOrCreateProgressAsync(userId, target.LessonId, now, db, ct);
        progress.CompletedAt = completed ? progress.CompletedAt ?? now : null;
        target.Enrollment.LastLessonId = target.LessonId;
        target.Enrollment.LastActivityAt = now;
        await SaveIgnoringDuplicateProgressAsync(db, ct);

        await LearningCompletion.UpdateAsync(db, target.CourseId, userId, now, ct);

        return TypedResults.Ok(await BuildProgressAsync(target.CourseId, userId, db, ct));
    }

    private static async Task<LessonProgress> GetOrCreateProgressAsync(Guid userId, Guid lessonId, DateTimeOffset now, AcademyDbContext db, CancellationToken ct)
    {
        var progress = await db.LessonProgress.SingleOrDefaultAsync(p => p.UserId == userId && p.LessonId == lessonId, ct);
        if (progress is null)
        {
            progress = new LessonProgress { UserId = userId, LessonId = lessonId, FirstViewedAt = now };
            db.LessonProgress.Add(progress);
        }

        return progress;
    }

    private static async Task SaveIgnoringDuplicateProgressAsync(AcademyDbContext db, CancellationToken ct)
    {
        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            // Otra petición simultánea creó el mismo registro de progreso; el estado final es equivalente.
        }
    }

    private static bool IsUniqueViolation(DbUpdateException ex) =>
        ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation };
}
