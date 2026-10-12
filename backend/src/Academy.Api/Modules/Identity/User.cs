using Academy.Api.Common.Persistence;
using Microsoft.AspNetCore.Identity;

namespace Academy.Api.Modules.Identity;

/// <summary>
/// Cuenta de usuario. Solo se guardan los datos mínimos necesarios: correo (en la entidad base
/// de Identity), un nombre visible y el idioma preferido.
/// </summary>
internal sealed class User : IdentityUser<Guid>, IAuditable
{
    public User()
    {
        Id = Guid.CreateVersion7();
        SecurityStamp = Guid.NewGuid().ToString();
    }

    public string DisplayName { get; set; } = string.Empty;

    public string PreferredLanguage { get; set; } = "es";

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }
}

internal sealed class Role : IdentityRole<Guid>
{
    public Role()
    {
        Id = Guid.CreateVersion7();
    }

    public Role(string name)
        : this()
    {
        Name = name;
        NormalizedName = name.ToUpperInvariant();
    }
}
