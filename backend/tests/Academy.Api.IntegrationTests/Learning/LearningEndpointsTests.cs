using System.Net;
using System.Net.Http.Json;
using Academy.Api.IntegrationTests.Infrastructure;
using Academy.Api.Modules.Catalog.Domain;

namespace Academy.Api.IntegrationTests.Learning;

public sealed class LearningEndpointsTests(PostgresFixture postgres) : IDisposable
{
    private readonly AcademyApiFactory _factory = new(postgres);

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    private sealed record Progress(bool Enrolled, DateTimeOffset? EnrolledAt, DateTimeOffset? CompletedAt, string? LastLessonSlug, string[] CompletedLessonSlugs, int TotalLessons);

    private sealed record LessonLink(string Slug, string Title);

    private sealed record LessonView(string CourseSlug, int ModuleNumber, string ModuleTitle, string Slug, string BodyMarkdown, string PracticeActivityMarkdown, string CheckCriteriaMarkdown, int Position, int TotalLessons, LessonLink? Previous, LessonLink? Next);

    private async Task<BrowserSession> StudentAsync()
    {
        var session = new BrowserSession(_factory.CreateBrowserClient());
        await session.RegisterNewStudentAsync();
        return session;
    }

    private static async Task<Progress> ReadProgressAsync(HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<Progress>(Ct))!;
    }

    [Fact]
    public async Task Lessons_of_published_courses_are_public_and_linked_in_order()
    {
        var course = await CatalogSeed.PublishedCourseAsync(_factory);
        using var client = _factory.CreateClient();

        var middle = await client.GetFromJsonAsync<LessonView>($"/api/catalog/courses/{course.Slug}/lessons/segunda", Ct);
        var crossModule = await client.GetFromJsonAsync<LessonView>($"/api/catalog/courses/{course.Slug}/lessons/tercera", Ct);

        Assert.Equal("Cuerpo de segunda", middle!.BodyMarkdown);
        Assert.Equal("Practica", middle.PracticeActivityMarkdown);
        Assert.Equal((2, 3), (middle.Position, middle.TotalLessons));
        Assert.Equal("primera", middle.Previous!.Slug);
        Assert.Equal("tercera", middle.Next!.Slug);
        Assert.Equal((2, "Módulo dos"), (crossModule!.ModuleNumber, crossModule.ModuleTitle));
        Assert.Null(crossModule.Next);
    }

    [Fact]
    public async Task Lessons_of_unpublished_courses_are_not_visible()
    {
        var course = await CatalogSeed.CourseAsync(_factory, ContentStatus.InDevelopment);
        using var client = _factory.CreateClient();

        var response = await client.GetAsync($"/api/catalog/courses/{course.Slug}/lessons/primera", Ct);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Progress_requires_a_session()
    {
        var course = await CatalogSeed.PublishedCourseAsync(_factory);
        using var client = _factory.CreateBrowserClient();

        var response = await client.GetAsync($"/api/learning/courses/{course.Slug}/progress", Ct);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Enrollment_is_free_idempotent_and_starts_empty()
    {
        var course = await CatalogSeed.PublishedCourseAsync(_factory);
        using var student = await StudentAsync();

        var before = await ReadProgressAsync(await student.Client.GetAsync($"/api/learning/courses/{course.Slug}/progress", Ct));
        var first = await ReadProgressAsync(await student.SendAsync(HttpMethod.Post, $"/api/learning/courses/{course.Slug}/enrollment"));
        var second = await ReadProgressAsync(await student.SendAsync(HttpMethod.Post, $"/api/learning/courses/{course.Slug}/enrollment"));

        Assert.False(before.Enrolled);
        Assert.Equal(3, before.TotalLessons);
        Assert.True(first.Enrolled);
        Assert.Empty(first.CompletedLessonSlugs);
        Assert.Equal(first.EnrolledAt, second.EnrolledAt);
    }

    [Fact]
    public async Task Courses_in_development_do_not_accept_enrollments()
    {
        var course = await CatalogSeed.CourseAsync(_factory, ContentStatus.InDevelopment);
        using var student = await StudentAsync();

        var response = await student.SendAsync(HttpMethod.Post, $"/api/learning/courses/{course.Slug}/enrollment");

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Progress_cannot_be_saved_without_enrollment()
    {
        var course = await CatalogSeed.PublishedCourseAsync(_factory);
        using var student = await StudentAsync();

        var visit = await student.SendAsync(HttpMethod.Put, $"/api/learning/courses/{course.Slug}/lessons/primera/visit");
        var complete = await student.SendAsync(HttpMethod.Put, $"/api/learning/courses/{course.Slug}/lessons/primera/completion");

        Assert.Equal(HttpStatusCode.Conflict, visit.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, complete.StatusCode);
    }

    [Fact]
    public async Task Visiting_a_lesson_saves_the_point_to_continue_from()
    {
        var course = await CatalogSeed.PublishedCourseAsync(_factory);
        using var student = await StudentAsync();
        await student.SendAsync(HttpMethod.Post, $"/api/learning/courses/{course.Slug}/enrollment");

        var visit = await student.SendAsync(HttpMethod.Put, $"/api/learning/courses/{course.Slug}/lessons/segunda/visit");
        var progress = await ReadProgressAsync(await student.Client.GetAsync($"/api/learning/courses/{course.Slug}/progress", Ct));

        Assert.Equal(HttpStatusCode.NoContent, visit.StatusCode);
        Assert.Equal("segunda", progress.LastLessonSlug);
        Assert.Empty(progress.CompletedLessonSlugs);
    }

    [Fact]
    public async Task Completing_every_lesson_completes_the_course_and_undoing_one_reopens_it()
    {
        var course = await CatalogSeed.PublishedCourseAsync(_factory);
        using var student = await StudentAsync();
        await student.SendAsync(HttpMethod.Post, $"/api/learning/courses/{course.Slug}/enrollment");

        Progress progress = null!;
        foreach (var lesson in course.LessonSlugs.Reverse())
        {
            progress = await ReadProgressAsync(await student.SendAsync(HttpMethod.Put, $"/api/learning/courses/{course.Slug}/lessons/{lesson}/completion"));
        }

        Assert.Equal(course.LessonSlugs, progress.CompletedLessonSlugs);
        Assert.NotNull(progress.CompletedAt);

        var reopened = await ReadProgressAsync(await student.SendAsync(HttpMethod.Delete, $"/api/learning/courses/{course.Slug}/lessons/segunda/completion"));

        Assert.Equal(["primera", "tercera"], reopened.CompletedLessonSlugs);
        Assert.Null(reopened.CompletedAt);
    }

    [Fact]
    public async Task Progress_belongs_to_each_person()
    {
        var course = await CatalogSeed.PublishedCourseAsync(_factory);
        using var ana = await StudentAsync();
        using var luis = await StudentAsync();
        await ana.SendAsync(HttpMethod.Post, $"/api/learning/courses/{course.Slug}/enrollment");
        await ana.SendAsync(HttpMethod.Put, $"/api/learning/courses/{course.Slug}/lessons/primera/completion");

        var luisProgress = await ReadProgressAsync(await luis.Client.GetAsync($"/api/learning/courses/{course.Slug}/progress", Ct));

        Assert.False(luisProgress.Enrolled);
        Assert.Empty(luisProgress.CompletedLessonSlugs);
    }

    [Fact]
    public async Task Unknown_courses_and_lessons_return_not_found()
    {
        var course = await CatalogSeed.PublishedCourseAsync(_factory);
        using var student = await StudentAsync();
        await student.SendAsync(HttpMethod.Post, $"/api/learning/courses/{course.Slug}/enrollment");

        var unknownCourse = await student.SendAsync(HttpMethod.Post, "/api/learning/courses/no-existe/enrollment");
        var unknownLesson = await student.SendAsync(HttpMethod.Put, $"/api/learning/courses/{course.Slug}/lessons/no-existe/completion");

        Assert.Equal(HttpStatusCode.NotFound, unknownCourse.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, unknownLesson.StatusCode);
    }

    public void Dispose() => _factory.Dispose();
}
