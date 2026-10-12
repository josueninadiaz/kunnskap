using YamlDotNet.Core;
using YamlDotNet.Serialization;
using YamlDotNet.Serialization.NamingConventions;

namespace Academy.Api.Modules.Catalog.Content;

/// <summary>
/// Lee una lección en Markdown:
/// <code>
/// ---
/// slug: tu-primer-programa
/// title: Tu primer programa
/// estimatedMinutes: 20
/// ---
/// Explicación y ejemplos…
///
/// ## Actividad práctica
/// …
///
/// ## Comprueba lo aprendido
/// …
///
/// ## Transcripción        (obligatoria solo si hay videoUrl)
/// …
/// </code>
/// </summary>
internal static class LessonParser
{
    public const string PracticeHeading = "## Actividad práctica";
    public const string CheckHeading = "## Comprueba lo aprendido";
    public const string TranscriptHeading = "## Transcripción";

    private static readonly IDeserializer Yaml = new DeserializerBuilder()
        .WithNamingConvention(CamelCaseNamingConvention.Instance)
        .Build();

    public static LessonDocument? Parse(string path, string text, List<string> errors)
    {
        text = text.Replace("\r\n", "\n", StringComparison.Ordinal);

        if (!text.StartsWith("---\n", StringComparison.Ordinal))
        {
            errors.Add($"{path}: debe empezar con una cabecera YAML entre líneas «---».");
            return null;
        }

        var end = text.IndexOf("\n---\n", 4, StringComparison.Ordinal);
        if (end < 0)
        {
            errors.Add($"{path}: falta la línea «---» que cierra la cabecera.");
            return null;
        }

        LessonFrontMatter? meta;
        try
        {
            meta = Yaml.Deserialize<LessonFrontMatter>(text[4..end]);
        }
        catch (YamlException ex)
        {
            errors.Add($"{path} (cabecera, línea {ex.Start.Line}): {ex.InnerException?.Message ?? ex.Message}");
            return null;
        }

        if (meta is null)
        {
            errors.Add($"{path}: la cabecera está vacía.");
            return null;
        }

        var errorCount = errors.Count;
        if (string.IsNullOrWhiteSpace(meta.Slug))
        {
            errors.Add($"{path}: falta slug en la cabecera.");
        }

        if (string.IsNullOrWhiteSpace(meta.Title) || meta.Title.Length > 200)
        {
            errors.Add($"{path}: title es obligatorio y no puede superar los 200 caracteres.");
        }

        if (meta.EstimatedMinutes <= 0)
        {
            errors.Add($"{path}: estimatedMinutes debe ser mayor que 0.");
        }

        if (meta.VideoUrl is not null && !(Uri.TryCreate(meta.VideoUrl, UriKind.Absolute, out var video) && video.Scheme == Uri.UriSchemeHttps))
        {
            errors.Add($"{path}: videoUrl debe ser una URL https.");
        }

        var content = text[(end + 5)..];
        var practiceAt = HeadingIndex(content, PracticeHeading);
        var checkAt = HeadingIndex(content, CheckHeading);
        var transcriptAt = HeadingIndex(content, TranscriptHeading);

        if (practiceAt < 0 || checkAt < 0 || checkAt < practiceAt)
        {
            errors.Add($"{path}: cada lección necesita, en este orden, «{PracticeHeading}» y «{CheckHeading}».");
            return null;
        }

        if (transcriptAt >= 0 && transcriptAt < checkAt)
        {
            errors.Add($"{path}: «{TranscriptHeading}» debe ir al final.");
            return null;
        }

        if (meta.VideoUrl is not null && transcriptAt < 0)
        {
            errors.Add($"{path}: una lección con video necesita «{TranscriptHeading}» (alternativa textual).");
        }

        var body = content[..practiceAt].Trim();
        var practice = content[(practiceAt + PracticeHeading.Length)..checkAt].Trim();
        var check = (transcriptAt < 0 ? content[(checkAt + CheckHeading.Length)..] : content[(checkAt + CheckHeading.Length)..transcriptAt]).Trim();
        var transcript = transcriptAt < 0 ? null : content[(transcriptAt + TranscriptHeading.Length)..].Trim();

        if (body.Length == 0 || practice.Length == 0 || check.Length == 0)
        {
            errors.Add($"{path}: la explicación, la actividad práctica y los criterios de comprobación no pueden estar vacíos.");
        }

        return errors.Count == errorCount ? new LessonDocument(path, meta, body, practice, check, transcript) : null;
    }

    /// <summary>Posición de un encabezado que ocupa una línea completa, o -1.</summary>
    private static int HeadingIndex(string content, string heading)
    {
        var index = 0;
        while ((index = content.IndexOf(heading, index, StringComparison.Ordinal)) >= 0)
        {
            var startsLine = index == 0 || content[index - 1] == '\n';
            var after = index + heading.Length;
            var endsLine = after == content.Length || content[after] == '\n';
            if (startsLine && endsLine)
            {
                return index;
            }

            index = after;
        }

        return -1;
    }
}
