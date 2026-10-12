using System.Net;
using System.Net.Http.Json;
using Academy.Api.IntegrationTests.Infrastructure;

namespace Academy.Api.IntegrationTests.Platform;

public sealed class PlatformEndpointsTests(PostgresFixture postgres) : IDisposable
{
    private readonly AcademyApiFactory _factory = new(postgres);

    private sealed record PlatformInfo(string Name, string DefaultLanguage);

    private sealed record Health(string Status, bool Database);

    [Fact]
    public async Task Health_reports_ok_when_the_database_is_reachable()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/health", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<Health>(TestContext.Current.CancellationToken);
        Assert.Equal(new Health("ok", true), body);
    }

    [Fact]
    public async Task Platform_name_comes_from_configuration()
    {
        using var client = _factory.CreateClient();

        var body = await client.GetFromJsonAsync<PlatformInfo>("/api/platform", TestContext.Current.CancellationToken);

        Assert.Equal(new PlatformInfo(AcademyApiFactory.PlatformName, "es"), body);
    }

    [Fact]
    public async Task Responses_include_security_headers()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/platform", TestContext.Current.CancellationToken);

        Assert.Equal("nosniff", response.Headers.GetValues("X-Content-Type-Options").Single());
        Assert.Equal("DENY", response.Headers.GetValues("X-Frame-Options").Single());
        Assert.Contains("default-src 'none'", response.Headers.GetValues("Content-Security-Policy").Single(), StringComparison.Ordinal);
        Assert.True(response.Headers.Contains("Referrer-Policy"));
    }

    [Fact]
    public async Task Unknown_routes_return_problem_details()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/does-not-exist", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task OpenApi_document_is_not_exposed_outside_development()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/openapi/v1.json", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    public void Dispose() => _factory.Dispose();
}
