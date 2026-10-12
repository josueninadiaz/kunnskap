using System.Net;
using System.Net.Http.Json;
using Academy.Api.Infrastructure.Persistence;
using Academy.Api.IntegrationTests.Infrastructure;
using Academy.Api.Modules.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Academy.Api.IntegrationTests.Identity;

/// <summary>
/// Los permisos se validan en el servidor: ocultar un botón en el frontend no es una medida de seguridad.
/// </summary>
public sealed class AuthorizationTests(PostgresFixture postgres) : IDisposable
{
    private readonly AcademyApiFactory _factory = new(postgres);

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    private sealed record UserRoles(Guid UserId, string[] Roles);

    /// <summary>Crea un administrador como se haría en producción: con el comando de consola.</summary>
    private async Task<(BrowserSession Session, BrowserSession.CurrentUser User)> NewAdminAsync()
    {
        var email = BrowserSession.NewEmail();
        var session = new BrowserSession(_factory.CreateBrowserClient());
        await session.RegisterNewStudentAsync(email);

        var exitCode = await RoleCommands.RunAsync(_factory.Services, ["roles", "grant", email, "Admin"]);
        Assert.Equal(0, exitCode);

        // Los permisos se calculan al iniciar sesión.
        await session.LogoutAsync();
        using var login = await session.LoginAsync(email);
        var user = await login.Content.ReadFromJsonAsync<BrowserSession.CurrentUser>(Ct);
        return (session, user!);
    }

    [Fact]
    public async Task The_four_roles_exist_after_migrations()
    {
        _ = _factory.Server;
        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AcademyDbContext>();

        var roles = await db.Roles.Select(r => r.Name).OrderBy(n => n).ToListAsync(Ct);

        Assert.Equal(["Admin", "Editor", "Instructor", "Student"], roles);
    }

    [Fact]
    public async Task Anonymous_visitors_cannot_manage_roles()
    {
        using var session = new BrowserSession(_factory.CreateBrowserClient());

        using var response = await session.SendAsync(HttpMethod.Put, $"/api/admin/users/{Guid.NewGuid()}/roles/Editor");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Students_cannot_grant_themselves_roles()
    {
        using var session = new BrowserSession(_factory.CreateBrowserClient());
        var student = await session.RegisterNewStudentAsync();

        using var response = await session.SendAsync(HttpMethod.Put, $"/api/admin/users/{student.Id}/roles/Admin");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Admins_have_every_permission()
    {
        var (session, admin) = await NewAdminAsync();
        using var _ = session;

        Assert.Contains("Admin", admin.Roles);
        Assert.Equal(Permissions.All.Order(StringComparer.Ordinal), admin.Permissions);
    }

    [Fact]
    public async Task Admins_can_grant_roles_and_the_new_permissions_apply_on_next_login()
    {
        var (adminSession, _) = await NewAdminAsync();
        using var __ = adminSession;

        var email = BrowserSession.NewEmail();
        using var studentSession = new BrowserSession(_factory.CreateBrowserClient());
        var student = await studentSession.RegisterNewStudentAsync(email);

        using var grant = await adminSession.SendAsync(HttpMethod.Put, $"/api/admin/users/{student.Id}/roles/editor");
        Assert.Equal(HttpStatusCode.OK, grant.StatusCode);
        var roles = await grant.Content.ReadFromJsonAsync<UserRoles>(Ct);
        Assert.Contains("Editor", roles!.Roles);

        await studentSession.LogoutAsync();
        using var login = await studentSession.LoginAsync(email);
        var refreshed = await login.Content.ReadFromJsonAsync<BrowserSession.CurrentUser>(Ct);
        Assert.Contains(Permissions.ContentManage, refreshed!.Permissions);
        Assert.DoesNotContain(Permissions.UsersManage, refreshed.Permissions);
    }

    [Fact]
    public async Task Admins_cannot_remove_their_own_admin_role()
    {
        var (session, admin) = await NewAdminAsync();
        using var _ = session;

        using var response = await session.SendAsync(HttpMethod.Delete, $"/api/admin/users/{admin.Id}/roles/Admin");

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Unknown_roles_and_users_are_rejected()
    {
        var (session, admin) = await NewAdminAsync();
        using var _ = session;

        using var unknownRole = await session.SendAsync(HttpMethod.Put, $"/api/admin/users/{admin.Id}/roles/Superusuario");
        using var unknownUser = await session.SendAsync(HttpMethod.Put, $"/api/admin/users/{Guid.NewGuid()}/roles/Editor");

        Assert.Equal(HttpStatusCode.BadRequest, unknownRole.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, unknownUser.StatusCode);
    }

    [Fact]
    public async Task Role_command_reports_unknown_accounts()
    {
        _ = _factory.Server;

        var exitCode = await RoleCommands.RunAsync(_factory.Services, ["roles", "grant", BrowserSession.NewEmail(), "Admin"]);

        Assert.Equal(1, exitCode);
    }

    public void Dispose() => _factory.Dispose();
}
