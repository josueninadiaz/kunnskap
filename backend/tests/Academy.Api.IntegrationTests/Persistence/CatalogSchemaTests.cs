using Academy.Api.Infrastructure.Persistence;
using Academy.Api.IntegrationTests.Infrastructure;
using Academy.Api.Modules.Catalog.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Academy.Api.IntegrationTests.Persistence;

/// <summary>
/// Verifica que las reglas de integridad viven también en la base de datos, no solo en el código.
/// </summary>
public sealed class CatalogSchemaTests(PostgresFixture postgres) : IDisposable
{
    private readonly AcademyApiFactory _factory = new(postgres);

    private AsyncServiceScope CreateScope(out AcademyDbContext db)
    {
        // Forzar el arranque del host para que se apliquen las migraciones.
        _ = _factory.Server;
        var scope = _factory.Services.CreateAsyncScope();
        db = scope.ServiceProvider.GetRequiredService<AcademyDbContext>();
        return scope;
    }

    private static School NewSchool() => new()
    {
        Slug = $"escuela-{Guid.NewGuid():N}",
        Name = "Escuela de prueba",
        Description = "Descripción",
    };

    private static Course NewCourse(School school, string? slug = null) => new()
    {
        School = school,
        Slug = slug ?? $"curso-{Guid.NewGuid():N}",
        Title = "Curso de prueba",
        Summary = "Resumen",
        DescriptionMarkdown = "Descripción",
        Level = CourseLevel.Beginner,
        EstimatedMinutes = 60,
    };

    [Fact]
    public async Task Stores_course_with_timestamps_and_arrays()
    {
        await using var scope = CreateScope(out var db);
        var course = NewCourse(NewSchool());
        course.LearningObjectives.AddRange(["Explicar qué es un algoritmo", "Escribir pseudocódigo"]);

        db.Courses.Add(course);
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        db.ChangeTracker.Clear();

        var stored = await db.Courses.SingleAsync(c => c.Id == course.Id, TestContext.Current.CancellationToken);
        Assert.Equal(course.LearningObjectives, stored.LearningObjectives);
        Assert.Equal(TimeSpan.Zero, stored.CreatedAt.Offset);
        Assert.NotEqual(default, stored.CreatedAt);
        Assert.NotEqual(0u, stored.Version);
    }

    [Fact]
    public async Task Course_slugs_are_unique()
    {
        await using var scope = CreateScope(out var db);
        var school = NewSchool();
        var slug = $"duplicado-{Guid.NewGuid():N}";
        db.Courses.AddRange(NewCourse(school, slug), NewCourse(school, slug));

        await Assert.ThrowsAsync<DbUpdateException>(() => db.SaveChangesAsync(TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task Published_courses_require_a_publication_date()
    {
        await using var scope = CreateScope(out var db);
        var course = NewCourse(NewSchool());
        course.Status = ContentStatus.Published;
        course.PublishedAt = null;
        db.Courses.Add(course);

        await Assert.ThrowsAsync<DbUpdateException>(() => db.SaveChangesAsync(TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task Concurrent_edits_to_a_course_are_detected()
    {
        await using var scope = CreateScope(out var db);
        var course = NewCourse(NewSchool());
        db.Courses.Add(course);
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);

        await using (var otherScope = _factory.Services.CreateAsyncScope())
        {
            var otherDb = otherScope.ServiceProvider.GetRequiredService<AcademyDbContext>();
            var copy = await otherDb.Courses.SingleAsync(c => c.Id == course.Id, TestContext.Current.CancellationToken);
            copy.Title = "Editado por otra persona";
            await otherDb.SaveChangesAsync(TestContext.Current.CancellationToken);
        }

        course.Title = "Edición desactualizada";
        await Assert.ThrowsAsync<DbUpdateConcurrencyException>(() => db.SaveChangesAsync(TestContext.Current.CancellationToken));
    }

    public void Dispose() => _factory.Dispose();
}
