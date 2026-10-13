using Academy.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Academy.Api.Modules.Learning;

/// <summary>
/// Regla de curso completado: todas las lecciones publicadas completadas y todos los cuestionarios
/// aprobados al menos una vez. Si se publica contenido nuevo, el curso vuelve a quedar abierto.
/// </summary>
internal static class LearningCompletion
{
    public static async Task UpdateAsync(AcademyDbContext db, Guid courseId, Guid userId, DateTimeOffset now, CancellationToken ct)
    {
        var enrollment = await db.Enrollments.SingleOrDefaultAsync(e => e.CourseId == courseId && e.UserId == userId, ct);
        if (enrollment is null)
        {
            return;
        }

        var totalLessons = await db.Lessons.CountAsync(l => l.Module!.CourseId == courseId, ct);
        var doneLessons = await db.LessonProgress.CountAsync(
            p => p.UserId == userId && p.CompletedAt != null && p.Lesson!.Module!.CourseId == courseId, ct);
        var totalQuizzes = await db.Quizzes.CountAsync(q => q.Module!.CourseId == courseId, ct);
        var passedQuizzes = await db.QuizAttempts
            .Where(a => a.UserId == userId && a.Passed && a.Quiz!.Module!.CourseId == courseId)
            .Select(a => a.QuizId)
            .Distinct()
            .CountAsync(ct);

        var complete = totalLessons > 0 && doneLessons == totalLessons && passedQuizzes == totalQuizzes;
        enrollment.CompletedAt = complete ? enrollment.CompletedAt ?? now : null;
        enrollment.LastActivityAt = now;
        await db.SaveChangesAsync(ct);
    }
}
