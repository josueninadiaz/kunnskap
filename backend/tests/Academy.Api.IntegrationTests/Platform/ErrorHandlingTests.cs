using System.Text.Json;
using Academy.Api.IntegrationTests.Infrastructure;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;

namespace Academy.Api.IntegrationTests.Platform;

public sealed class ErrorHandlingTests(PostgresFixture postgres) : IDisposable
{
    private readonly AcademyApiFactory _factory = new(postgres);

    [Fact]
    public async Task Internal_errors_hide_exception_details_and_include_a_trace_id()
    {
        using var scope = _factory.Services.CreateScope();
        var problemDetails = scope.ServiceProvider.GetRequiredService<IProblemDetailsService>();

        var context = new DefaultHttpContext { RequestServices = scope.ServiceProvider };
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        using var body = new MemoryStream();
        context.Response.Body = body;

        var written = await problemDetails.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = context,
            Exception = new InvalidOperationException("detalle interno secreto"),
            ProblemDetails = { Status = StatusCodes.Status500InternalServerError, Detail = "detalle interno secreto" },
        });

        Assert.True(written);
        var json = JsonDocument.Parse(body.ToArray()).RootElement;
        Assert.DoesNotContain("secreto", json.GetRawText(), StringComparison.Ordinal);
        Assert.True(json.TryGetProperty("traceId", out _));
        Assert.Equal(500, json.GetProperty("status").GetInt32());
    }

    public void Dispose() => _factory.Dispose();
}
