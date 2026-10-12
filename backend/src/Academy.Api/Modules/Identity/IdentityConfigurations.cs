using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Academy.Api.Modules.Identity;

/// <summary>
/// Los roles se crean mediante una migración (datos semilla), así existen en cualquier base de datos
/// creada desde cero. Los identificadores son fijos y no deben cambiarse nunca.
/// </summary>
internal sealed class RoleConfiguration : IEntityTypeConfiguration<Role>
{
    private static readonly Dictionary<string, Guid> RoleIds = new()
    {
        [Roles.Student] = new Guid("019a1c00-0000-7000-8000-000000000001"),
        [Roles.Instructor] = new Guid("019a1c00-0000-7000-8000-000000000002"),
        [Roles.Editor] = new Guid("019a1c00-0000-7000-8000-000000000003"),
        [Roles.Admin] = new Guid("019a1c00-0000-7000-8000-000000000004"),
    };

    public void Configure(EntityTypeBuilder<Role> builder)
    {
        builder.HasData(Roles.All.Select(name => new Role
        {
            Id = RoleIds[name],
            Name = name,
            NormalizedName = name.ToUpperInvariant(),
            ConcurrencyStamp = RoleIds[name].ToString(),
        }));
    }
}
