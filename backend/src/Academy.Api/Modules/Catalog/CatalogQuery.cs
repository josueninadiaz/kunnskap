namespace Academy.Api.Modules.Catalog;

/// <summary>Reglas puras de las consultas del catálogo (probadas con pruebas unitarias).</summary>
internal static class CatalogQuery
{
    /// <summary>
    /// Rangos de duración del filtro, en minutos (ambos límites incluidos):
    /// corto ≤ 10 h, medio 10–30 h, largo &gt; 30 h.
    /// </summary>
    public static readonly IReadOnlyDictionary<string, (int Min, int Max)> DurationRanges =
        new Dictionary<string, (int Min, int Max)>(StringComparer.OrdinalIgnoreCase)
        {
            ["corto"] = (1, 600),
            ["medio"] = (601, 1800),
            ["largo"] = (1801, int.MaxValue),
        };

    public static (int Min, int Max)? ParseDuration(string? value, Dictionary<string, string[]> errors)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        if (DurationRanges.TryGetValue(value, out var range))
        {
            return range;
        }

        errors["duration"] = [$"Valor no válido. Opciones: {string.Join(", ", DurationRanges.Keys)}."];
        return null;
    }

    /// <summary>
    /// Patrón ILIKE "contiene" con los comodines del usuario escapados: buscar "100%" no debe
    /// interpretarse como "100 seguido de cualquier cosa".
    /// </summary>
    public static string ContainsPattern(string term)
    {
        var escaped = term
            .Replace(@"\", @"\\", StringComparison.Ordinal)
            .Replace("%", @"\%", StringComparison.Ordinal)
            .Replace("_", @"\_", StringComparison.Ordinal);
        return $"%{escaped}%";
    }
}
