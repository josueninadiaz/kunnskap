using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Academy.Api.Infrastructure.Persistence;
using Academy.Api.Modules.Catalog.Domain;
using Academy.Api.Modules.Learning;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace Academy.Api.Modules.Assessments;

// ——— Vista para responder: NUNCA incluye qué opciones son correctas ni las respuestas aceptadas. ———

internal sealed record QuizOptionView(Guid Id, string TextMarkdown);

internal sealed record QuizQuestionView(Guid Id, QuestionType Type, string PromptMarkdown, int Points, IReadOnlyList<QuizOptionView> Options);

internal sealed record QuizView(
    string CourseSlug,
    string CourseTitle,
    int ModuleNumber,
    string ModuleTitle,
    string Slug,
    string Title,
    int PassingScorePercent,
    IReadOnlyList<QuizQuestionView> Questions);

// ——— Envío y resultado ———

public sealed class AnswerInput
{
    public Guid QuestionId { get; init; }

    public List<Guid> OptionIds { get; init; } = [];

    [StringLength(200, ErrorMessage = "La respuesta no puede superar los 200 caracteres.")]
    public string? Text { get; init; }
}

// Los DTO de petición son públicos: el generador de validación de .NET 10 ignora los tipos internal.
public sealed class SubmitAttemptRequest
{
    [Required]
    [MaxLength(100)]
    public List<AnswerInput> Answers { get; init; } = [];
}

internal sealed record QuestionResult(
    Guid QuestionId,
    bool Correct,
    int PointsAwarded,
    // Explicación: solo si se acertó esta pregunta o se aprobó el cuestionario.
    string? ExplanationMarkdown,
    // Pista: solo si se falló y aún no se ha aprobado.
    string? HintMarkdown,
    string? LessonSlug,
    // Respuestas correctas: solo al aprobar.
    IReadOnlyList<Guid>? CorrectOptionIds,
    string? AcceptedAnswer);

internal sealed record AttemptResult(
    Guid AttemptId,
    DateTimeOffset SubmittedAt,
    decimal ScorePercent,
    bool Passed,
    int PassingScorePercent,
    IReadOnlyList<QuestionResult> Questions);

internal sealed record AttemptSummary(Guid AttemptId, DateTimeOffset SubmittedAt, decimal ScorePercent, bool Passed);

internal static class QuizEndpoints
{
    public static IEndpointRouteBuilder MapQuizEndpoints(this IEndpointRouteBuilder api)
    {
        api.MapGet("/catalog/courses/{slug}/quizzes/{quizSlug}", GetQuizAsync)
            .WithTags("Evaluaciones")
            .WithSummary("Cuestionario de un curso publicado, sin respuestas. Es público.");

        var learning = api.MapGroup("/learning/courses/{slug}/quizzes/{quizSlug}/attempts")
            .WithTags("Evaluaciones")
            .RequireAuthorization();

        learning.MapPost("", SubmitAsync)
            .WithSummary("Envía un intento. El servidor lo corrige y lo guarda. Requiere inscripción.");

        learning.MapGet("", GetHistoryAsync)
            .WithSummary("Historial de intentos de la persona en este cuestionario, del más reciente al más antiguo.");

        return api;
    }

    private static IQueryable<Quiz> PublishedQuiz(AcademyDbContext db, string slug, string quizSlug) =>
        db.Quizzes.Where(q => q.Slug == quizSlug && q.Module!.Course!.Slug == slug && q.Module.Course.Status == ContentStatus.Published);

    private static async Task<Results<Ok<QuizView>, NotFound>> GetQuizAsync(string slug, string quizSlug, AcademyDbContext db, CancellationToken ct)
    {
        var quiz = await PublishedQuiz(db, slug, quizSlug)
            .AsNoTracking()
            .Select(q => new QuizView(
                q.Module!.Course!.Slug,
                q.Module.Course.Title,
                q.Module.SortOrder,
                q.Module.Title,
                q.Slug,
                q.Title,
                q.PassingScorePercent,
                q.Questions
                    .OrderBy(x => x.SortOrder)
                    .Select(x => new QuizQuestionView(
                        x.Id,
                        x.Type,
                        x.PromptMarkdown,
                        x.Points,
                        x.Options.OrderBy(o => o.SortOrder).Select(o => new QuizOptionView(o.Id, o.TextMarkdown)).ToList()))
                    .ToList()))
            .SingleOrDefaultAsync(ct);

        return quiz is null ? TypedResults.NotFound() : TypedResults.Ok(quiz);
    }

    private static Guid UserId(ClaimsPrincipal user) => Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private static async Task<Results<Ok<AttemptResult>, NotFound, ProblemHttpResult, ValidationProblem>> SubmitAsync(
        string slug,
        string quizSlug,
        SubmitAttemptRequest request,
        ClaimsPrincipal user,
        AcademyDbContext db,
        TimeProvider time,
        CancellationToken ct)
    {
        var quiz = await PublishedQuiz(db, slug, quizSlug)
            .Include(q => q.Questions).ThenInclude(q => q.Options)
            .Include(q => q.Module)
            .AsSplitQuery()
            .SingleOrDefaultAsync(ct);
        if (quiz is null)
        {
            return TypedResults.NotFound();
        }

        var userId = UserId(user);
        var courseId = quiz.Module!.CourseId;
        if (!await db.Enrollments.AnyAsync(e => e.CourseId == courseId && e.UserId == userId, ct))
        {
            return TypedResults.Problem(
                statusCode: StatusCodes.Status409Conflict,
                title: "No estás inscrito en este curso.",
                detail: "Inscríbete gratis para guardar tus resultados.");
        }

        var questionIds = quiz.Questions.Select(q => q.Id).ToHashSet();
        if (request.Answers.Any(a => !questionIds.Contains(a.QuestionId)))
        {
            return TypedResults.ValidationProblem(new Dictionary<string, string[]>
            {
                ["answers"] = ["Hay respuestas a preguntas que no pertenecen a este cuestionario."],
            });
        }

        var answers = request.Answers
            .GroupBy(a => a.QuestionId)
            .ToDictionary(g => g.Key, g => g.Last());

        var attempt = new QuizAttempt { UserId = userId, QuizId = quiz.Id, SubmittedAt = time.GetUtcNow() };
        var total = 0;
        var awarded = 0;

        foreach (var question in quiz.Questions)
        {
            answers.TryGetValue(question.Id, out var answer);
            var validOptionIds = question.Options.Select(o => o.Id).ToHashSet();
            var selected = (answer?.OptionIds ?? []).Where(validOptionIds.Contains).Distinct().ToList();
            var text = question.Type == QuestionType.ShortAnswer ? answer?.Text?.Trim() : null;
            var correct = Grading.IsCorrect(question, selected, text);

            total += question.Points;
            awarded += correct ? question.Points : 0;
            attempt.Answers.Add(new AttemptAnswer
            {
                QuestionId = question.Id,
                SelectedOptionIds = selected,
                TextAnswer = text,
                IsCorrect = correct,
                PointsAwarded = correct ? question.Points : 0,
            });
        }

        attempt.ScorePercent = Grading.ScorePercent(awarded, total);
        attempt.Passed = attempt.ScorePercent >= quiz.PassingScorePercent;
        db.QuizAttempts.Add(attempt);
        await db.SaveChangesAsync(ct);

        await LearningCompletion.UpdateAsync(db, courseId, userId, time.GetUtcNow(), ct);

        return TypedResults.Ok(ToResult(quiz, attempt));
    }

    /// <summary>
    /// Qué se revela tras corregir: al acertar, la explicación; al fallar, solo la pista y la lección
    /// para repasar. Las respuestas correctas y todas las explicaciones, solo al aprobar.
    /// </summary>
    private static AttemptResult ToResult(Quiz quiz, QuizAttempt attempt)
    {
        var results = quiz.Questions
            .OrderBy(q => q.SortOrder)
            .Select(q =>
            {
                var a = attempt.Answers.Single(x => x.QuestionId == q.Id);
                var reveal = attempt.Passed;
                return new QuestionResult(
                    q.Id,
                    a.IsCorrect,
                    a.PointsAwarded,
                    a.IsCorrect || reveal ? q.ExplanationMarkdown : null,
                    !a.IsCorrect && !reveal ? q.HintMarkdown : null,
                    q.LessonSlug,
                    reveal && q.Type != QuestionType.ShortAnswer ? [.. q.Options.Where(o => o.IsCorrect).OrderBy(o => o.SortOrder).Select(o => o.Id)] : null,
                    reveal && q.Type == QuestionType.ShortAnswer ? q.AcceptedAnswers.FirstOrDefault() : null);
            })
            .ToList();

        return new AttemptResult(attempt.Id, attempt.SubmittedAt, attempt.ScorePercent, attempt.Passed, quiz.PassingScorePercent, results);
    }

    private static async Task<Results<Ok<List<AttemptSummary>>, NotFound>> GetHistoryAsync(
        string slug, string quizSlug, ClaimsPrincipal user, AcademyDbContext db, CancellationToken ct)
    {
        var quizId = await PublishedQuiz(db, slug, quizSlug).Select(q => (Guid?)q.Id).SingleOrDefaultAsync(ct);
        if (quizId is null)
        {
            return TypedResults.NotFound();
        }

        var userId = UserId(user);
        var history = await db.QuizAttempts
            .AsNoTracking()
            .Where(a => a.QuizId == quizId && a.UserId == userId)
            .OrderByDescending(a => a.SubmittedAt)
            .Take(20)
            .Select(a => new AttemptSummary(a.Id, a.SubmittedAt, a.ScorePercent, a.Passed))
            .ToListAsync(ct);

        return TypedResults.Ok(history);
    }
}
