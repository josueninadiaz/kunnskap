using System.Net.Http.Json;

namespace Academy.Api.IntegrationTests.Infrastructure;

/// <summary>
/// Simula cómo el frontend usa la API: obtiene el token antiforgery, lo envía en la cabecera
/// X-XSRF-TOKEN y lo renueva cuando cambia la identidad (registro, inicio y cierre de sesión).
/// </summary>
public sealed class BrowserSession(HttpClient client) : IDisposable
{
    public const string Password = "una frase de prueba segura";

    private string? _token;

    public HttpClient Client => client;

    public sealed record CurrentUser(Guid Id, string Email, string DisplayName, string[] Roles, string[] Permissions);

    private sealed record TokenResponse(string Token);

    public static string NewEmail() => $"persona-{Guid.NewGuid():N}@example.org";

    public async Task RefreshTokenAsync()
    {
        var response = await client.GetFromJsonAsync<TokenResponse>("/api/auth/antiforgery", Ct);
        _token = response!.Token;
    }

    public async Task<HttpResponseMessage> SendAsync(HttpMethod method, string url, object? body = null)
    {
        if (_token is null)
        {
            await RefreshTokenAsync();
        }

        using var request = new HttpRequestMessage(method, url);
        request.Headers.Add("X-XSRF-TOKEN", _token);
        if (body is not null)
        {
            request.Content = JsonContent.Create(body);
        }

        return await client.SendAsync(request, Ct);
    }

    public async Task<HttpResponseMessage> RegisterAsync(string email, string password = Password, string displayName = "Ana")
    {
        var response = await SendAsync(HttpMethod.Post, "/api/auth/register", new { email, password, displayName });
        await RefreshTokenAsync();
        return response;
    }

    public async Task<HttpResponseMessage> LoginAsync(string email, string password = Password, bool rememberMe = false)
    {
        var response = await SendAsync(HttpMethod.Post, "/api/auth/login", new { email, password, rememberMe });
        await RefreshTokenAsync();
        return response;
    }

    public async Task<HttpResponseMessage> LogoutAsync()
    {
        var response = await SendAsync(HttpMethod.Post, "/api/auth/logout");
        await RefreshTokenAsync();
        return response;
    }

    public Task<HttpResponseMessage> MeAsync() => client.GetAsync("/api/auth/me", Ct);

    public async Task<CurrentUser> RegisterNewStudentAsync(string? email = null)
    {
        using var response = await RegisterAsync(email ?? NewEmail());
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<CurrentUser>(Ct))!;
    }

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    public void Dispose() => client.Dispose();
}
