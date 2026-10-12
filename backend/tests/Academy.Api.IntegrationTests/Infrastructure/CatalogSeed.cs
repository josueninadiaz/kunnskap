using Academy.Api.Infrastructure.Persistence;
using Academy.Api.Modules.Catalog.Domain;
using Microsoft.Extensions.DependencyInjection;

namespace Academy.Api.IntegrationTests.Infrastructure;

/// <summary>Datos de prueba del catálogo con slugs únicos (la base de datos se comparte entre pruebas).</summary>
internal static class CatalogSeed
{
    public sealed record SeededCourse(string Slug, IReadOnlyList<string> LessonSlugs);

    /// <summary>Curso publicado: módulo 1 con dos lecciones, módulo 2 con una.</summary>
    public static Task<SeededCourse> PublishedCourseAsync(AcademyApiFactory factory) =>
        CourseAsync(factory, ContentStatus.Published);

    public static async Task<SeededCourse> CourseAsync(AcademyApiFactory factory, ContentStatus status)
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

        db.Courses.Add(course);
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);

        return new SeededCourse(course.Slug, ["primera", "segunda", "tercera"]);
    }
}
