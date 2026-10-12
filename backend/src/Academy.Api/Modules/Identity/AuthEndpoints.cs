using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Academy.Api.Common.Security;
using Academy.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;

namespace Academy.Api.Modules.Identity;

// Los DTO de petición son públicos: el generador de validación de .NET 10 ignora los tipos internal.
public sealed class RegisterRequest
{
    [Required(ErrorMessage = "Escribe tu correo electrónico.")]
    [EmailAddress(ErrorMessage = "Escribe un correo electrónico válido.")]
    [StringLength(254, ErrorMessage = "El correo es demasiado largo.")]
    public string Email { get; init; } = string.Empty;

    [Required(ErrorMessage = "Escribe una contraseña.")]
    [StringLength(128, ErrorMessage = "La contraseña no puede superar los 128 caracteres.")]
    public string Password { get; init; } = string.Empty;

    [Required(ErrorMessage = "Escribe cómo quieres que te llamemos.")]
    [StringLength(80, MinimumLength = 2, ErrorMessage = "El nombre debe tener entre 2 y 80 caracteres.")]
    public string DisplayName { get; init; } = string.Empty;
}

public sealed class LoginRequest
{
    [Required(ErrorMessage = "Escribe tu correo electrónico.")]
    [StringLength(254)]
    public string Email { get; init; } = string.Empty;

    [Required(ErrorMessage = "Escribe tu contraseña.")]
    [StringLength(128)]
    public string Password { get; init; } = string.Empty;

    /// <summary>Si es falso, la sesión termina al cerrar el navegador (ordenadores compartidos).</summary>
    public bool RememberMe { get; init; }
}

internal sealed record CurrentUserResponse(
    Guid Id,
    string Email,
    string DisplayName,
    IReadOnlyList<string> Roles,
    IReadOnlyList<string> Permissions);

internal sealed record AntiforgeryTokenResponse(string Token);

internal static partial class AuthEndpoints
{
    private const string InvalidCredentials =
        "Correo o contraseña incorrectos. Tras 5 intentos fallidos la cuenta se bloquea 15 minutos.";

    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder api)
    {
        var group = api.MapGroup("/auth").WithTags("Auth");

        group.MapGet("/antiforgery", GetAntiforgeryToken)
            .WithSummary("Devuelve el token que debe enviarse en la cabecera X-XSRF-TOKEN en peticiones que modifican datos.");

        group.MapPost("/register", RegisterAsync)
            .RequireRateLimiting(RateLimiting.AuthPolicy)
            .WithSummary("Crea una cuenta de estudiante gratuita e inicia sesión.");

        group.MapPost("/login", LoginAsync)
            .RequireRateLimiting(RateLimiting.AuthPolicy)
            .WithSummary("Inicia sesión con correo y contraseña.");

        group.MapPost("/logout", LogoutAsync)
            .WithSummary("Cierra la sesión actual.");

        group.MapGet("/me", GetCurrentUserAsync)
            .RequireAuthorization()
            .WithSummary("Datos de la persona que ha iniciado sesión.");

        return api;
    }

    private static Ok<AntiforgeryTokenResponse> GetAntiforgeryToken(HttpContext context, IAntiforgery antiforgery)
    {
        var tokens = antiforgery.GetAndStoreTokens(context);
        context.Response.Headers.CacheControl = "no-store";
        return TypedResults.Ok(new AntiforgeryTokenResponse(tokens.RequestToken!));
    }

    private static async Task<Results<Created<CurrentUserResponse>, ValidationProblem>> RegisterAsync(
        RegisterRequest request,
        UserManager<User> userManager,
        SignInManager<User> signInManager,
        AcademyDbContext db,
        ILoggerFactory loggerFactory)
    {
        var email = request.Email.Trim();
        var user = new User
        {
            UserName = email,
            Email = email,
            DisplayName = request.DisplayName.Trim(),
        };

        await using var transaction = await db.Database.BeginTransactionAsync();

        var created = await userManager.CreateAsync(user, request.Password);
        if (!created.Succeeded)
        {
            return TypedResults.ValidationProblem(ToValidationErrors(created.Errors));
        }

        var roleAdded = await userManager.AddToRoleAsync(user, Roles.Student);
        if (!roleAdded.Succeeded)
        {
            throw new InvalidOperationException("No se pudo asignar el rol de estudiante a una cuenta nueva.");
        }

        await transaction.CommitAsync();

        // Sin "recordarme": la primera sesión termina al cerrar el navegador.
        await signInManager.SignInAsync(user, isPersistent: false);
        var logger = loggerFactory.CreateLogger(typeof(AuthEndpoints));
        LogRegistered(logger, user.Id);

        var principal = await signInManager.CreateUserPrincipalAsync(user);
        return TypedResults.Created("/api/auth/me", ToResponse(user, principal));
    }

    private static async Task<Results<Ok<CurrentUserResponse>, ProblemHttpResult>> LoginAsync(
        LoginRequest request,
        UserManager<User> userManager,
        SignInManager<User> signInManager,
        IPasswordHasher<User> passwordHasher,
        ILoggerFactory loggerFactory)
    {
        var logger = loggerFactory.CreateLogger(typeof(AuthEndpoints));
        var user = await userManager.FindByEmailAsync(request.Email.Trim());

        if (user is null)
        {
            // Mismo coste que una comprobación real para no revelar, por el tiempo de respuesta,
            // si existe una cuenta con ese correo.
            passwordHasher.VerifyHashedPassword(DummyUser, DummyHash.Value, request.Password);
            LogLoginFailed(logger);
            return InvalidCredentialsProblem();
        }

        var result = await signInManager.PasswordSignInAsync(
            user, request.Password, isPersistent: request.RememberMe, lockoutOnFailure: true);

        if (!result.Succeeded)
        {
            LogLoginFailed(logger);
            return InvalidCredentialsProblem();
        }

        LogLoggedIn(logger, user.Id);
        var principal = await signInManager.CreateUserPrincipalAsync(user);
        return TypedResults.Ok(ToResponse(user, principal));
    }

    private static async Task<NoContent> LogoutAsync(SignInManager<User> signInManager)
    {
        await signInManager.SignOutAsync();
        return TypedResults.NoContent();
    }

    private static async Task<Results<Ok<CurrentUserResponse>, UnauthorizedHttpResult>> GetCurrentUserAsync(
        ClaimsPrincipal principal,
        UserManager<User> userManager)
    {
        var user = await userManager.GetUserAsync(principal);
        return user is null
            ? TypedResults.Unauthorized()
            : TypedResults.Ok(ToResponse(user, principal));
    }

    private static CurrentUserResponse ToResponse(User user, ClaimsPrincipal principal) =>
        new(
            user.Id,
            user.Email ?? string.Empty,
            user.DisplayName,
            [.. principal.FindAll(ClaimTypes.Role).Select(c => c.Value).Order(StringComparer.Ordinal)],
            [.. principal.FindAll(Permissions.ClaimType).Select(c => c.Value).Order(StringComparer.Ordinal)]);

    private static ProblemHttpResult InvalidCredentialsProblem() =>
        TypedResults.Problem(
            statusCode: StatusCodes.Status401Unauthorized,
            title: "No se pudo iniciar sesión.",
            detail: InvalidCredentials);

    private static Dictionary<string, string[]> ToValidationErrors(IEnumerable<IdentityError> errors) =>
        errors
            .GroupBy(e => e.Code.StartsWith("Password", StringComparison.Ordinal) ? "password" : "email")
            .ToDictionary(g => g.Key, g => g.Select(e => e.Description).Distinct(StringComparer.Ordinal).ToArray());

    private static readonly User DummyUser = new();

    private static readonly Lazy<string> DummyHash = new(() =>
        new PasswordHasher<User>().HashPassword(DummyUser, Guid.NewGuid().ToString()));

    // Nunca se registran correos, contraseñas ni cookies: solo identificadores internos.
    [LoggerMessage(Level = LogLevel.Information, Message = "Cuenta creada: {UserId}")]
    private static partial void LogRegistered(ILogger logger, Guid userId);

    [LoggerMessage(Level = LogLevel.Information, Message = "Inicio de sesión correcto: {UserId}")]
    private static partial void LogLoggedIn(ILogger logger, Guid userId);

    [LoggerMessage(Level = LogLevel.Warning, Message = "Inicio de sesión fallido")]
    private static partial void LogLoginFailed(ILogger logger);
}
