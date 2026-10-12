using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Academy.Api.IntegrationTests.Infrastructure;

namespace Academy.Api.IntegrationTests.Identity;

public sealed class AuthEndpointsTests(PostgresFixture postgres) : IDisposable
{
    private readonly AcademyApiFactory _factory = new(postgres);

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    private BrowserSession NewSession() => new(_factory.CreateBrowserClient());

    private static string SessionCookie(HttpResponseMessage response) =>
        response.Headers.GetValues("Set-Cookie").Single(c => c.StartsWith("kunnskap_session=", StringComparison.Ordinal));

    private static async Task<JsonElement> ReadJsonAsync(HttpResponseMessage response) =>
        JsonDocument.Parse(await response.Content.ReadAsStringAsync(Ct)).RootElement;

    private static string[] ErrorsFor(JsonElement problem, string field) =>
        problem.GetProperty("errors").EnumerateObject()
            .Where(p => string.Equals(p.Name, field, StringComparison.OrdinalIgnoreCase))
            .SelectMany(p => p.Value.EnumerateArray().Select(v => v.GetString()!))
            .ToArray();

    [Fact]
    public async Task Register_creates_a_student_and_starts_a_secure_browser_session()
    {
        using var session = NewSession();
        var email = BrowserSession.NewEmail();

        using var response = await session.RegisterAsync(email);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var cookie = SessionCookie(response).ToLowerInvariant();
        Assert.Contains("httponly", cookie, StringComparison.Ordinal);
        Assert.Contains("samesite=strict", cookie, StringComparison.Ordinal);
        Assert.Contains("secure", cookie, StringComparison.Ordinal);
        Assert.DoesNotContain("expires=", cookie, StringComparison.Ordinal);

        var user = await response.Content.ReadFromJsonAsync<BrowserSession.CurrentUser>(Ct);
        Assert.Equal(email, user!.Email);
        Assert.Equal(["Student"], user.Roles);
        Assert.Empty(user.Permissions);

        using var me = await session.MeAsync();
        Assert.Equal(HttpStatusCode.OK, me.StatusCode);
    }

    [Fact]
    public async Task Requests_that_change_data_without_the_antiforgery_token_are_rejected()
    {
        using var client = _factory.CreateBrowserClient();

        using var response = await client.PostAsJsonAsync(
            "/api/auth/register",
            new { email = BrowserSession.NewEmail(), password = BrowserSession.Password, displayName = "Ana" },
            Ct);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("antiforgery", (await ReadJsonAsync(response)).GetProperty("code").GetString());
    }

    [Fact]
    public async Task Register_rejects_short_passwords_with_a_clear_message()
    {
        using var session = NewSession();

        using var response = await session.RegisterAsync(BrowserSession.NewEmail(), password: "corta");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var errors = ErrorsFor(await ReadJsonAsync(response), "password");
        Assert.Contains(errors, e => e.Contains("12 caracteres", StringComparison.Ordinal));
    }

    [Fact]
    public async Task Register_validates_email_and_display_name()
    {
        using var session = NewSession();

        using var response = await session.RegisterAsync("no-es-un-correo", displayName: "");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await ReadJsonAsync(response);
        Assert.NotEmpty(ErrorsFor(problem, "email"));
        Assert.NotEmpty(ErrorsFor(problem, "displayName"));
    }

    [Fact]
    public async Task Register_rejects_an_email_that_already_has_an_account()
    {
        using var session = NewSession();
        var email = BrowserSession.NewEmail();
        await session.RegisterNewStudentAsync(email);

        using var other = NewSession();
        using var response = await other.RegisterAsync(email.ToUpperInvariant());

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.NotEmpty(ErrorsFor(await ReadJsonAsync(response), "email"));
    }

    [Fact]
    public async Task Login_logout_cycle_works()
    {
        var email = BrowserSession.NewEmail();
        using (var registration = NewSession())
        {
            await registration.RegisterNewStudentAsync(email);
        }

        using var session = NewSession();
        using (var login = await session.LoginAsync(email))
        {
            Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        }

        using (var me = await session.MeAsync())
        {
            Assert.Equal(HttpStatusCode.OK, me.StatusCode);
        }

        using (var logout = await session.LogoutAsync())
        {
            Assert.Equal(HttpStatusCode.NoContent, logout.StatusCode);
        }

        using var afterLogout = await session.MeAsync();
        Assert.Equal(HttpStatusCode.Unauthorized, afterLogout.StatusCode);
    }

    [Fact]
    public async Task Wrong_password_and_unknown_email_get_the_same_answer()
    {
        var email = BrowserSession.NewEmail();
        using var session = NewSession();
        await session.RegisterNewStudentAsync(email);
        await session.LogoutAsync();

        using var wrongPassword = await session.LoginAsync(email, "contraseña equivocada");
        using var unknownEmail = await session.LoginAsync(BrowserSession.NewEmail());

        Assert.Equal(HttpStatusCode.Unauthorized, wrongPassword.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, unknownEmail.StatusCode);
        Assert.Equal(
            (await ReadJsonAsync(wrongPassword)).GetProperty("detail").GetString(),
            (await ReadJsonAsync(unknownEmail)).GetProperty("detail").GetString());
    }

    [Fact]
    public async Task Account_is_locked_after_five_failed_attempts()
    {
        var email = BrowserSession.NewEmail();
        using var session = NewSession();
        await session.RegisterNewStudentAsync(email);
        await session.LogoutAsync();

        for (var i = 0; i < 5; i++)
        {
            using var failed = await session.LoginAsync(email, "contraseña equivocada");
        }

        using var correctPassword = await session.LoginAsync(email);

        Assert.Equal(HttpStatusCode.Unauthorized, correctPassword.StatusCode);
    }

    [Fact]
    public async Task Remember_me_makes_the_session_cookie_persistent()
    {
        var email = BrowserSession.NewEmail();
        using var session = NewSession();
        await session.RegisterNewStudentAsync(email);
        await session.LogoutAsync();

        using var response = await session.LoginAsync(email, rememberMe: true);

        Assert.Contains("expires=", SessionCookie(response).ToLowerInvariant(), StringComparison.Ordinal);
    }

    [Fact]
    public async Task Me_requires_a_session()
    {
        using var client = _factory.CreateBrowserClient();

        using var response = await client.GetAsync("/api/auth/me", Ct);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    public void Dispose() => _factory.Dispose();
}

public sealed class AuthRateLimitTests(PostgresFixture postgres) : IDisposable
{
    private readonly AcademyApiFactory _factory = new(
        postgres,
        new Dictionary<string, string> { ["RateLimiting:Auth:PermitLimit"] = "3" });

    [Fact]
    public async Task Too_many_login_attempts_from_the_same_address_are_throttled()
    {
        using var session = new BrowserSession(_factory.CreateBrowserClient());

        for (var i = 0; i < 3; i++)
        {
            using var attempt = await session.LoginAsync(BrowserSession.NewEmail());
            Assert.Equal(HttpStatusCode.Unauthorized, attempt.StatusCode);
        }

        using var throttled = await session.LoginAsync(BrowserSession.NewEmail());

        Assert.Equal(HttpStatusCode.TooManyRequests, throttled.StatusCode);
        Assert.True(throttled.Headers.Contains("Retry-After"));
        Assert.Equal("application/problem+json", throttled.Content.Headers.ContentType?.MediaType);
    }

    public void Dispose() => _factory.Dispose();
}
