using Academy.Api.Infrastructure.Persistence;
using Academy.Api.Modules.Assessments;
using Academy.Api.Modules.Catalog.Domain;
using Microsoft.Extensions.DependencyInjection;

namespace Academy.Api.IntegrationTests.Infrastructure;

/// <summary>Datos de prueba del catálogo con slugs únicos (la base de datos se comparte entre pruebas).</summary>
internal static class CatalogSeed
{
    public sealed record SeededCourse(string Slug, IReadOnlyList<string> LessonSlugs, string? QuizSlug);

    /// <summary>
    /// Curso publicado: módulo 1 con dos lecciones y un cuestionario de 3 preguntas (aprobado = 70 %),
    /// módulo 2 con una lección.
    /// </summary>
    public static Task<SeededCourse> PublishedCourseAsync(AcademyApiFactory factory, bool withQuiz = false) =>
        CourseAsync(factory, ContentStatus.Published, withQuiz);

    public static async Task<SeededCourse> CourseAsync(AcademyApiFactory factory, ContentStatus status, bool withQuiz = false)
    {
        _ = factory.Server;
        var id = Guid.NewGuid().ToString("N")[..10];
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AcademyDbContext>();

        var course = new Course
        {
            School = new School { Slug = $"escuela-{id}", Name = $"Escuela {id}", Description = "Prueba" },
            Slug = $"curso-{id}",
            Title = $"Curso {id}",
            Summary = "Resumen",
            DescriptionMarkdown = "Descripción",
            Level = CourseLevel.Beginner,
            Status = status,
            EstimatedMinutes = 35,
            PublishedAt = status == ContentStatus.Published ? DateTimeOffset.UtcNow : null,
        };

        static Lesson NewLesson(string slug, int order) => new()
        {
            Slug = slug,
            Title = $"Lección {slug}",
            BodyMarkdown = $"Cuerpo de {slug}",
            PracticeActivityMarkdown = "Practica",
            CheckCriteriaMarkdown = "Comprueba",
            EstimatedMinutes = 10,
            SortOrder = order,
        };

        var module1 = new CourseModule { Title = "Módulo uno", SortOrder = 1 };
        module1.Lessons.AddRange([NewLesson("primera", 1), NewLesson("segunda", 2)]);
        var module2 = new CourseModule { Title = "Módulo dos", SortOrder = 2 };
        module2.Lessons.Add(NewLesson("tercera", 1));
        course.Modules.AddRange([module1, module2]);

        if (!withQuiz)
        {
            db.Courses.Add(course);
            await db.SaveChangesAsync(TestContext.Current.CancellationToken);
            return new SeededCourse(course.Slug, ["primera", "segunda", "tercera"], null);
        }

        var quiz = new Quiz { Slug = $"cuestionario-{id}", Title = "Cuestionario", Module = module1, PassingScorePercent = 70 };
        var single = new Question { Key = "unica", Type = QuestionType.SingleChoice, PromptMarkdown = "¿Única?", ExplanationMarkdown = "EXPLICACION-UNICA", HintMarkdown = "PISTA-UNICA", LessonSlug = "primera", SortOrder = 1 };
        single.Options.AddRange([
            new QuestionOption { TextMarkdown = "Sí", IsCorrect = true, SortOrder = 1 },
            new QuestionOption { TextMarkdown = "No", SortOrder = 2 },
        ]);
        var multiple = new Question { Key = "multiple", Type = QuestionType.MultipleChoice, PromptMarkdown = "¿Varias?", ExplanationMarkdown = "EXPLICACION-MULTIPLE", HintMarkdown = "PISTA-MULTIPLE", SortOrder = 2 };
        multiple.Options.AddRange([
            new QuestionOption { TextMarkdown = "A", IsCorrect = true, SortOrder = 1 },
            new QuestionOption { TextMarkdown = "B", IsCorrect = true, SortOrder = 2 },
            new QuestionOption { TextMarkdown = "C", SortOrder = 3 },
        ]);
        var shortAnswer = new Question { Key = "corta", Type = QuestionType.ShortAnswer, PromptMarkdown = "¿Comando?", ExplanationMarkdown = "EXPLICACION-CORTA", HintMarkdown = "PISTA-CORTA", AcceptedAnswers = ["dotnet run hola.cs"], SortOrder = 3 };
        quiz.Questions.AddRange([single, multiple, shortAnswer]);
        db.Quizzes.Add(quiz);

        db.Courses.Add(course);
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);

        return new SeededCourse(course.Slug, ["primera", "segunda", "tercera"], quiz.Slug);
    }
}
