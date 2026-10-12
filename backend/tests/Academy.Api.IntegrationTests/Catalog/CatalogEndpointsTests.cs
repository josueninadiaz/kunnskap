using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Academy.Api.Infrastructure.Persistence;
using Academy.Api.IntegrationTests.Infrastructure;
using Academy.Api.Modules.Catalog.Domain;
using Microsoft.Extensions.DependencyInjection;

namespace Academy.Api.IntegrationTests.Catalog;

/// <summary>
/// Cada prueba crea su propia escuela con un slug único y filtra por ella, para no depender del
/// contenido real ni de otras pruebas que comparten la base de datos.
/// </summary>
public sealed class CatalogEndpointsTests(PostgresFixture postgres) : IDisposable
{
    private readonly AcademyApiFactory _factory = new(postgres);

    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() },
    };

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    private sealed record Tech(string Slug, string Name);

    private sealed record Item(string Slug, string Title, CourseLevel Level, ContentStatus Status, int? EstimatedMinutes, Tech[] Technologies, int ModuleCount);

    private sealed record PagedItems(Item[] Items, int Page, int PageSize, int TotalCount);

    private sealed record LessonDto(string Slug, string Title, int EstimatedMinutes);

    private sealed record ModuleDto(string Title, string Summary, LessonDto[] Lessons);

    private sealed record Detail(string Slug, string Title, ContentStatus Status, string[] LearningObjectives, ModuleDto[] Modules);

    private sealed record SchoolFacet(string Slug, string Name, int PublishedCourses, int CoursesInDevelopment);

    private sealed record Facets(SchoolFacet[] Schools, Tech[] Technologies, CourseLevel[] Levels);

    /// <summary>Escuela con cuatro cursos: publicado, en preparación, borrador y archivado.</summary>
    private sealed record Fixture(string School, string Technology, string Published, string InDevelopment, string Draft, string Archived);

    private async Task<Fixture> SeedAsync()
    {
        _ = _factory.Server;
        var id = Guid.NewGuid().ToString("N")[..10];
        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AcademyDbContext>();

        var school = new School { Slug = $"escuela-{id}", Name = $"Escuela {id}", Description = "Prueba" };
        var tech = new Technology { Slug = $"tec-{id}", Name = $"Tec {id}" };

        Course NewCourse(string slug, string title, ContentStatus status, CourseLevel level, int? minutes, int order) => new()
        {
            School = school,
            Slug = $"{slug}-{id}",
            Title = title,
            Summary = $"Resumen del curso {title}",
            DescriptionMarkdown = "Descripción",
            Level = level,
            Status = status,
            EstimatedMinutes = minutes,
            SortOrder = order,
            PublishedAt = status == ContentStatus.Published ? DateTimeOffset.UtcNow : null,
        };

        var published = NewCourse("publicado", "Introducción a la lógica", ContentStatus.Published, CourseLevel.Beginner, 300, 1);
        published.LearningObjectives.Add("Escribir un algoritmo");
        published.Technologies.Add(tech);
        var module2 = new CourseModule { Title = "Segundo módulo", SortOrder = 2 };
        var module1 = new CourseModule { Title = "Primer módulo", SortOrder = 1 };
        module1.Lessons.Add(new Lesson { Slug = "b", Title = "Lección B", BodyMarkdown = "B", EstimatedMinutes = 10, SortOrder = 2 });
        module1.Lessons.Add(new Lesson { Slug = "a", Title = "Lección A", BodyMarkdown = "A", EstimatedMinutes = 15, SortOrder = 1 });
        published.Modules.AddRange([module2, module1]);

        var inDevelopment = NewCourse("preparacion", "Redes avanzadas", ContentStatus.InDevelopment, CourseLevel.Advanced, null, 2);
        var draft = NewCourse("borrador", "Lógica secreta", ContentStatus.Draft, CourseLevel.Beginner, null, 3);
        var archived = NewCourse("archivado", "Lógica antigua", ContentStatus.Archived, CourseLevel.Beginner, 100, 4);

        db.Courses.AddRange(published, inDevelopment, draft, archived);
        await db.SaveChangesAsync(Ct);

        return new Fixture(school.Slug, tech.Slug, published.Slug, inDevelopment.Slug, draft.Slug, archived.Slug);
    }

    private async Task<PagedItems> SearchAsync(string query)
    {
        using var client = _factory.CreateClient();
        var response = await client.GetAsync($"/api/catalog/courses?{query}", Ct);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<PagedItems>(Json, Ct))!;
    }

    [Fact]
    public async Task Lists_published_and_in_development_courses_but_hides_drafts_and_archived()
    {
        var f = await SeedAsync();

        var page = await SearchAsync($"school={f.School}");

        Assert.Equal([f.Published, f.InDevelopment], page.Items.Select(i => i.Slug));
        Assert.Equal(2, page.TotalCount);
        Assert.Equal(ContentStatus.InDevelopment, page.Items[1].Status);
        Assert.Null(page.Items[1].EstimatedMinutes);
    }

    [Fact]
    public async Task Search_ignores_accents_and_case()
    {
        var f = await SeedAsync();

        var page = await SearchAsync($"school={f.School}&q=LOGICA");

        Assert.Equal([f.Published], page.Items.Select(i => i.Slug));
    }

    [Fact]
    public async Task Search_treats_wildcards_as_text()
    {
        var f = await SeedAsync();

        var page = await SearchAsync($"school={f.School}&q=%25");

        Assert.Empty(page.Items);
    }

    [Theory]
    [InlineData("level=advanced", "preparacion")]
    [InlineData("status=Published", "publicado")]
    [InlineData("duration=corto", "publicado")]
    public async Task Filters_narrow_the_results(string filter, string expectedPrefix)
    {
        var f = await SeedAsync();

        var page = await SearchAsync($"school={f.School}&{filter}");

        Assert.Single(page.Items);
        Assert.StartsWith(expectedPrefix, page.Items[0].Slug, StringComparison.Ordinal);
    }

    [Fact]
    public async Task Filters_by_technology()
    {
        var f = await SeedAsync();

        var page = await SearchAsync($"technology={f.Technology}");

        Assert.Equal([f.Published], page.Items.Select(i => i.Slug));
        Assert.Equal(f.Technology, page.Items[0].Technologies.Single().Slug);
    }

    [Fact]
    public async Task Paginates_results()
    {
        var f = await SeedAsync();

        var second = await SearchAsync($"school={f.School}&pageSize=1&page=2");

        Assert.Equal(2, second.TotalCount);
        Assert.Equal([f.InDevelopment], second.Items.Select(i => i.Slug));
    }

    [Theory]
    [InlineData("level=experto")]
    [InlineData("duration=eterno")]
    [InlineData("status=Draft")]
    [InlineData("pageSize=500")]
    [InlineData("page=0")]
    public async Task Invalid_filters_are_rejected(string query)
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync($"/api/catalog/courses?{query}", Ct);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Course_detail_includes_objectives_and_ordered_syllabus()
    {
        var f = await SeedAsync();
        using var client = _factory.CreateClient();

        var detail = await client.GetFromJsonAsync<Detail>($"/api/catalog/courses/{f.Published}", Json, Ct);

        Assert.Equal(["Escribir un algoritmo"], detail!.LearningObjectives);
        Assert.Equal(["Primer módulo", "Segundo módulo"], detail.Modules.Select(m => m.Title));
        Assert.Equal(["a", "b"], detail.Modules[0].Lessons.Select(l => l.Slug));
    }

    [Fact]
    public async Task Drafts_and_archived_courses_do_not_exist_for_the_public()
    {
        var f = await SeedAsync();
        using var client = _factory.CreateClient();

        var draft = await client.GetAsync($"/api/catalog/courses/{f.Draft}", Ct);
        var archived = await client.GetAsync($"/api/catalog/courses/{f.Archived}", Ct);

        Assert.Equal(HttpStatusCode.NotFound, draft.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, archived.StatusCode);
    }

    [Fact]
    public async Task Facets_count_visible_courses_per_school()
    {
        var f = await SeedAsync();
        using var client = _factory.CreateClient();

        var facets = await client.GetFromJsonAsync<Facets>("/api/catalog/facets", Json, Ct);

        var school = facets!.Schools.Single(s => s.Slug == f.School);
        Assert.Equal(1, school.PublishedCourses);
        Assert.Equal(1, school.CoursesInDevelopment);
        Assert.Contains(facets.Technologies, t => t.Slug == f.Technology);
        Assert.Equal(Enum.GetValues<CourseLevel>(), facets.Levels);
    }

    public void Dispose() => _factory.Dispose();
}
