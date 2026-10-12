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
    public const string CohortsManage = "cohorts:manage";
    public const string UsersManage = "users:manage";

    public static readonly IReadOnlyList<string> All = [ContentManage, ContentPublish, CohortsManage, UsersManage];
}

internal static class Roles
{
    public const string Student = "Student";
    public const string Instructor = "Instructor";
    public const string Editor = "Editor";
    public const string Admin = "Admin";

    public static readonly IReadOnlyList<string> All = [Student, Instructor, Editor, Admin];

    public static readonly IReadOnlyDictionary<string, IReadOnlyList<string>> PermissionsByRole =
        new Dictionary<string, IReadOnlyList<string>>
        {
            [Student] = [],
            // Solo gestiona las ediciones donde está asignado (se comprobará por recurso en el módulo de ediciones).
            [Instructor] = [Permissions.CohortsManage],
            [Editor] = [Permissions.ContentManage],
            [Admin] = Permissions.All,
        };

    /// <summary>Normaliza el nombre de un rol ("admin" → "Admin"). Devuelve null si no existe.</summary>
    public static string? Find(string name) =>
        All.FirstOrDefault(r => string.Equals(r, name, StringComparison.OrdinalIgnoreCase));
}
