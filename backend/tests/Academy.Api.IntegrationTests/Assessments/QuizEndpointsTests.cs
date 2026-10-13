using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Academy.Api.IntegrationTests.Infrastructure;

namespace Academy.Api.IntegrationTests.Assessments;

public sealed class QuizEndpointsTests(PostgresFixture postgres) : IDisposable
{
    private readonly AcademyApiFactory _factory = new(postgres);

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    private sealed record OptionView(Guid Id, string TextMarkdown);

    private sealed record QuestionView(Guid Id, string Type, string PromptMarkdown, OptionView[] Options);

    private sealed record QuizView(string Slug, int PassingScorePercent, QuestionView[] Questions);

    private sealed record QuestionResult(Guid QuestionId, bool Correct, string? ExplanationMarkdown, string? HintMarkdown, string? LessonSlug, Guid[]? CorrectOptionIds, string? AcceptedAnswer);

    private sealed record AttemptResult(Guid AttemptId, decimal ScorePercent, bool Passed, QuestionResult[] Questions);

    private sealed record AttemptSummary(Guid AttemptId, decimal ScorePercent, bool Passed);

    private sealed record Progress(DateTimeOffset? CompletedAt, string[] PassedQuizSlugs, int TotalQuizzes);

    private async Task<(CatalogSeed.SeededCourse Course, QuizView Quiz)> SeedAsync()
    {
        var course = await CatalogSeed.PublishedCourseAsync(_factory, withQuiz: true);
        using var client = _factory.CreateClient();
        var quiz = await client.GetFromJsonAsync<QuizView>($"/api/catalog/courses/{course.Slug}/quizzes/{course.QuizSlug!}", Ct);
        return (course, quiz!);
    }

    private async Task<BrowserSession> EnrolledStudentAsync(string courseSlug)
    {
        var session = new BrowserSession(_factory.CreateBrowserClient());
        await session.RegisterNewStudentAsync();
        (await session.SendAsync(HttpMethod.Post, $"/api/learning/courses/{courseSlug}/enrollment")).EnsureSuccessStatusCode();
        return session;
    }

    /// <summary>Respuestas: la única (0 = correcta), la múltiple (índices) y la corta.</summary>
    private static object Answers(QuizView quiz, int single, int[] multiple, string text) => new
    {
        answers = new object[]
        {
            new { questionId = quiz.Questions[0].Id, optionIds = new[] { quiz.Questions[0].Options[single].Id } },
            new { questionId = quiz.Questions[1].Id, optionIds = multiple.Select(i => quiz.Questions[1].Options[i].Id).ToArray() },
            new { questionId = quiz.Questions[2].Id, text },
        },
    };

    private static async Task<AttemptResult> ReadResultAsync(HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<AttemptResult>(Ct))!;
    }

    [Fact]
    public async Task The_public_quiz_never_reveals_answers_explanations_or_hints()
    {
        var course = await CatalogSeed.PublishedCourseAsync(_factory, withQuiz: true);
        using var client = _factory.CreateClient();

        var json = await client.GetStringAsync($"/api/catalog/courses/{course.Slug}/quizzes/{course.QuizSlug!}", Ct);

        Assert.DoesNotContain("isCorrect", json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("dotnet run", json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("EXPLICACION", json, StringComparison.Ordinal);
        Assert.DoesNotContain("PISTA", json, StringComparison.Ordinal);
        var quiz = JsonSerializer.Deserialize<QuizView>(json, JsonSerializerOptions.Web)!;
        Assert.Equal(3, quiz.Questions.Length);
        Assert.Equal(["Sí", "No"], quiz.Questions[0].Options.Select(o => o.TextMarkdown));
    }

    [Fact]
    public async Task Submitting_requires_a_session_and_an_enrollment()
    {
        var (course, quiz) = await SeedAsync();
        var url = $"/api/learning/courses/{course.Slug}/quizzes/{course.QuizSlug!}/attempts";

        using var anonymous = new BrowserSession(_factory.CreateBrowserClient());
        var noSession = await anonymous.SendAsync(HttpMethod.Post, url, Answers(quiz, 0, [0, 1], "x"));

        using var student = new BrowserSession(_factory.CreateBrowserClient());
        await student.RegisterNewStudentAsync();
        var notEnrolled = await student.SendAsync(HttpMethod.Post, url, Answers(quiz, 0, [0, 1], "x"));

        Assert.Equal(HttpStatusCode.Unauthorized, noSession.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, notEnrolled.StatusCode);
    }

    [Fact]
    public async Task A_failed_attempt_gives_hints_for_mistakes_but_not_the_answers()
    {
        var (course, quiz) = await SeedAsync();
        using var student = await EnrolledStudentAsync(course.Slug);

        var result = await ReadResultAsync(await student.SendAsync(
            HttpMethod.Post, $"/api/learning/courses/{course.Slug}/quizzes/{course.QuizSlug!}/attempts", Answers(quiz, 0, [0], "dotnet hola")));

        Assert.False(result.Passed);
        Assert.Equal(33.33m, result.ScorePercent);
        var (single, multiple, shortAnswer) = (result.Questions[0], result.Questions[1], result.Questions[2]);
        Assert.True(single.Correct);
        Assert.Equal("EXPLICACION-UNICA", single.ExplanationMarkdown);
        Assert.False(multiple.Correct);
        Assert.Null(multiple.ExplanationMarkdown);
        Assert.Equal("PISTA-MULTIPLE", multiple.HintMarkdown);
        Assert.All(result.Questions, q => Assert.Null(q.CorrectOptionIds));
        Assert.Null(shortAnswer.AcceptedAnswer);
        Assert.Equal("primera", single.LessonSlug);
    }

    [Fact]
    public async Task Passing_reveals_every_explanation_and_correct_answer()
    {
        var (course, quiz) = await SeedAsync();
        using var student = await EnrolledStudentAsync(course.Slug);

        var result = await ReadResultAsync(await student.SendAsync(
            HttpMethod.Post, $"/api/learning/courses/{course.Slug}/quizzes/{course.QuizSlug!}/attempts", Answers(quiz, 0, [1, 0], "  DOTNET  run Hola.cs ")));

        Assert.True(result.Passed);
        Assert.Equal(100m, result.ScorePercent);
        Assert.All(result.Questions, q => Assert.NotNull(q.ExplanationMarkdown));
        Assert.All(result.Questions, q => Assert.Null(q.HintMarkdown));
        Assert.Equal([quiz.Questions[0].Options[0].Id], result.Questions[0].CorrectOptionIds!);
        Assert.Equal(2, result.Questions[1].CorrectOptionIds!.Length);
        Assert.Equal("dotnet run hola.cs", result.Questions[2].AcceptedAnswer);
    }

    [Fact]
    public async Task Answers_to_other_questions_are_rejected()
    {
        var (course, _) = await SeedAsync();
        using var student = await EnrolledStudentAsync(course.Slug);

        var response = await student.SendAsync(
            HttpMethod.Post,
            $"/api/learning/courses/{course.Slug}/quizzes/{course.QuizSlug!}/attempts",
            new { answers = new[] { new { questionId = Guid.NewGuid(), text = "x" } } });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task History_is_private_and_newest_first()
    {
        var (course, quiz) = await SeedAsync();
        using var ana = await EnrolledStudentAsync(course.Slug);
        using var luis = await EnrolledStudentAsync(course.Slug);
        var url = $"/api/learning/courses/{course.Slug}/quizzes/{course.QuizSlug!}/attempts";

        await ana.SendAsync(HttpMethod.Post, url, Answers(quiz, 1, [2], "no"));
        await ana.SendAsync(HttpMethod.Post, url, Answers(quiz, 0, [0, 1], "dotnet run hola.cs"));

        var anaHistory = await ana.Client.GetFromJsonAsync<AttemptSummary[]>(url, Ct);
        var luisHistory = await luis.Client.GetFromJsonAsync<AttemptSummary[]>(url, Ct);

        Assert.Equal([true, false], anaHistory!.Select(a => a.Passed));
        Assert.Empty(luisHistory!);
    }

    [Fact]
    public async Task The_course_is_completed_only_after_passing_its_quiz()
    {
        var (course, quiz) = await SeedAsync();
        using var student = await EnrolledStudentAsync(course.Slug);
        foreach (var lesson in course.LessonSlugs)
        {
            await student.SendAsync(HttpMethod.Put, $"/api/learning/courses/{course.Slug}/lessons/{lesson}/completion");
        }

        var beforeQuiz = await student.Client.GetFromJsonAsync<Progress>($"/api/learning/courses/{course.Slug}/progress", Ct);
        await student.SendAsync(HttpMethod.Post, $"/api/learning/courses/{course.Slug}/quizzes/{course.QuizSlug!}/attempts", Answers(quiz, 0, [0, 1], "dotnet run hola.cs"));
        var afterQuiz = await student.Client.GetFromJsonAsync<Progress>($"/api/learning/courses/{course.Slug}/progress", Ct);

        Assert.Null(beforeQuiz!.CompletedAt);
        Assert.Equal(1, beforeQuiz.TotalQuizzes);
        Assert.NotNull(afterQuiz!.CompletedAt);
        Assert.Equal([course.QuizSlug!], afterQuiz.PassedQuizSlugs);
    }

    public void Dispose() => _factory.Dispose();
}
