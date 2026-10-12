using System.Globalization;
using Microsoft.AspNetCore.Identity;

namespace Academy.Api.Modules.Identity;

/// <summary>Mensajes de error de Identity en español claro, sin tecnicismos.</summary>
internal sealed class SpanishIdentityErrorDescriber : IdentityErrorDescriber
{
    public override IdentityError DefaultError() =>
        new() { Code = nameof(DefaultError), Description = "No se pudo completar la operación." };

    public override IdentityError PasswordTooShort(int length) =>
        new()
        {
            Code = nameof(PasswordTooShort),
            Description = string.Create(CultureInfo.InvariantCulture, $"La contraseña debe tener al menos {length} caracteres. Una frase fácil de recordar funciona bien."),
        };

    public override IdentityError PasswordRequiresUniqueChars(int uniqueChars) =>
        new()
        {
            Code = nameof(PasswordRequiresUniqueChars),
            Description = string.Create(CultureInfo.InvariantCulture, $"La contraseña debe tener al menos {uniqueChars} caracteres distintos."),
        };

    public override IdentityError DuplicateEmail(string email) =>
        new() { Code = nameof(DuplicateEmail), Description = "Ya existe una cuenta con este correo. Puedes iniciar sesión." };

    public override IdentityError DuplicateUserName(string userName) =>
        new() { Code = nameof(DuplicateUserName), Description = "Ya existe una cuenta con este correo. Puedes iniciar sesión." };

    public override IdentityError InvalidEmail(string? email) =>
        new() { Code = nameof(InvalidEmail), Description = "Escribe un correo electrónico válido." };

    public override IdentityError InvalidUserName(string? userName) =>
        new() { Code = nameof(InvalidUserName), Description = "Escribe un correo electrónico válido." };

    public override IdentityError UserAlreadyInRole(string role) =>
        new() { Code = nameof(UserAlreadyInRole), Description = "La persona ya tiene ese rol." };

    public override IdentityError UserNotInRole(string role) =>
        new() { Code = nameof(UserNotInRole), Description = "La persona no tiene ese rol." };
}
