using System.ComponentModel.DataAnnotations;

namespace Academy.Api.Common.Platform;

/// <summary>
/// Datos públicos de la plataforma. El nombre (Kunnskap, «conocimiento» en noruego) se define por configuración
/// (<c>Platform__Name</c>) para no acoplarlo al código.
/// </summary>
internal sealed class PlatformOptions
{
    public const string SectionName = "Platform";

    [Required, StringLength(80, MinimumLength = 2)]
    public string Name { get; init; } = "Kunnskap";

    [Required, StringLength(10, MinimumLength = 2)]
    public string DefaultLanguage { get; init; } = "es";
}

internal static class PlatformOptionsExtensions
{
    public static IServiceCollection AddPlatformOptions(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddOptions<PlatformOptions>()
            .Bind(configuration.GetSection(PlatformOptions.SectionName))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        return services;
    }
}
