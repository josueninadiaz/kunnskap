using Academy.Api.Modules.Catalog.Content;

namespace Academy.Api.UnitTests.Catalog;

public class LessonParserTests
{
    private const string Valid = """
        ---
        slug: tu-primer-programa
        title: Tu primer programa
        estimatedMinutes: 20
        ---
        Explicación con un ejemplo.

        ## Actividad práctica
        Escribe hola.cs.

        ## Comprueba lo aprendido
        - Se ejecuta sin errores.
        """;

    private static (LessonDocument? Lesson, List<string> Errors) Parse(string text)
    {
        var errors = new List<string>();
        return (LessonParser.Parse("leccion.md", text, errors), errors);
    }

    [Fact]
    public void Parses_front_matter_and_the_three_sections()
    {
        var (lesson, errors) = Parse(Valid);

        Assert.Empty(errors);
        Assert.Equal("tu-primer-programa", lesson!.Meta.Slug);
        Assert.Equal(20, lesson.Meta.EstimatedMinutes);
        Assert.Equal("Explicación con un ejemplo.", lesson.Body);
        Assert.Equal("Escribe hola.cs.", lesson.PracticeActivity);
        Assert.Equal("- Se ejecuta sin errores.", lesson.CheckCriteria);
        Assert.Null(lesson.Transcript);
    }

    [Fact]
    public void Accepts_windows_line_endings()
    {
        var (lesson, errors) = Parse(Valid.Replace("\n", "\r\n", StringComparison.Ordinal));

        Assert.Empty(errors);
        Assert.NotNull(lesson);
    }

    [Fact]
    public void Requires_practice_activity_and_check_criteria()
    {
        var (lesson, errors) = Parse(Valid.Replace("## Actividad práctica", "## Práctica", StringComparison.Ordinal));

        Assert.Null(lesson);
        Assert.Contains(errors, e => e.Contains("Actividad práctica", StringComparison.Ordinal));
    }

    [Fact]
    public void Section_headings_must_appear_in_order()
    {
        const string text = """
            ---
            slug: leccion
            title: Lección
            estimatedMinutes: 5
            ---
            Cuerpo

            ## Comprueba lo aprendido
            Criterios

            ## Actividad práctica
            Actividad
            """;

        var (lesson, _) = Parse(text);

        Assert.Null(lesson);
    }

    [Fact]
    public void Headings_only_count_when_they_fill_a_whole_line()
    {
        var text = Valid.Replace("Explicación con un ejemplo.", "Texto que menciona ## Actividad práctica en medio.", StringComparison.Ordinal);

        var (lesson, errors) = Parse(text);

        Assert.Empty(errors);
        Assert.Contains("en medio", lesson!.Body, StringComparison.Ordinal);
    }

    [Fact]
    public void Video_lessons_need_a_transcript()
    {
        var text = Valid.Replace("estimatedMinutes: 20", "estimatedMinutes: 20\nvideoUrl: https://example.org/video", StringComparison.Ordinal);

        var (_, errors) = Parse(text);

        Assert.Contains(errors, e => e.Contains("Transcripción", StringComparison.Ordinal));
    }

    [Fact]
    public void Transcript_is_read_when_present()
    {
        var text = Valid.Replace("estimatedMinutes: 20", "estimatedMinutes: 20\nvideoUrl: https://example.org/video", StringComparison.Ordinal)
            + "\n## Transcripción\nTexto del video.\n";

        var (lesson, errors) = Parse(text);

        Assert.Empty(errors);
        Assert.Equal("Texto del video.", lesson!.Transcript);
        Assert.Equal("- Se ejecuta sin errores.", lesson.CheckCriteria);
    }

    [Theory]
    [InlineData("Sin cabecera\n## Actividad práctica\na\n## Comprueba lo aprendido\nb")]
    [InlineData("---\nslug: a\ntitle: A\nestimatedMinutes: 5\nsin cierre")]
    public void Rejects_missing_or_unclosed_front_matter(string text)
    {
        var (lesson, errors) = Parse(text);

        Assert.Null(lesson);
        Assert.NotEmpty(errors);
    }

    [Theory]
    [InlineData("estimatedMinutes: 20", "estimatedMinutes: 0")]
    [InlineData("estimatedMinutes: 20", "estimatedMinutes: 20\nvideoUrl: http://inseguro.org")]
    [InlineData("slug: tu-primer-programa", "slug: ''")]
    public void Validates_front_matter_values(string original, string replacement)
    {
        var (lesson, errors) = Parse(Valid.Replace(original, replacement, StringComparison.Ordinal));

        Assert.Null(lesson);
        Assert.NotEmpty(errors);
    }
}
