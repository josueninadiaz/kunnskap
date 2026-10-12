namespace Academy.Api.Modules.Identity;

/// <summary>
/// Permisos de la plataforma. Se definen en código (no en la base de datos) para que cualquier
/// cambio en la matriz de permisos pase por revisión en un pull request.
/// </summary>
internal static class Permissions
{
    public const string ClaimType = "permission";

    public const string ContentManage = "content:manage";
    public const string ContentPublish = "content:publish";
    public const string UsersManage = "users:manage";

    public static readonly IReadOnlyList<string> All = [ContentManage, ContentPublish, UsersManage];
}

internal static class Roles
{
    public const string Student = "Student";
    public const string Editor = "Editor";
    public const string Admin = "Admin";

    public static readonly IReadOnlyDictionary<string, IReadOnlyList<string>> PermissionsByRole =
        new Dictionary<string, IReadOnlyList<string>>
        {
            [Student] = [],
            [Editor] = [Permissions.ContentManage],
            [Admin] = Permissions.All,
        };
}
