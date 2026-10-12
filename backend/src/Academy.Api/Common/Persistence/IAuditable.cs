namespace Academy.Api.Common.Persistence;

/// <summary>
/// Entidades cuyas fechas de creación y modificación se rellenan automáticamente (UTC)
/// al guardar cambios. Ver <see cref="AuditableInterceptor"/>.
/// </summary>
internal interface IAuditable
{
    DateTimeOffset CreatedAt { get; set; }

    DateTimeOffset UpdatedAt { get; set; }
}
