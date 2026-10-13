namespace Academy.Api.Modules.Catalog.Content;

// Forma de los archivos YAML de content/. Ver content/README.md.
// Las propiedades son mutables porque YamlDotNet las rellena al deserializar.

internal sealed class SchoolDocument
{
    public string Slug { get; set; } = string.Empty;

    public int Order { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;
}

internal sealed class TechnologyDocument
{
    public string Slug { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;
}

internal sealed class CourseDocument
{
    public string Slug { get; set; } = string.Empty;

    public string School { get; set; } = string.Empty;

    public int Order { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Summary { get; set; } = string.Empty;

    public string? Description { get; set; }

    public string Level { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public int? EstimatedMinutes { get; set; }

    public string Language { get; set; } = "es";

    public List<string> Technologies { get; set; } = [];

    public List<string> Objectives { get; set; } = [];

    public List<string> Prerequisites { get; set; } = [];

    public List<string> Authors { get; set; } = [];

    public List<string> SoftwareVersions { get; set; } = [];

    public DateOnly? LastReviewedAt { get; set; }

    public List<ModuleDocument> Modules { get; set; } = [];
}

internal sealed class ModuleDocument
{
    public string Title { get; set; } = string.Empty;

    public string Summary { get; set; } = string.Empty;

    /// <summary>Carpeta (relativa al curso) con las lecciones del módulo en Markdown. Opcional.</summary>
    public string? Lessons { get; set; }

    /// <summary>Archivo YAML (relativo al curso) con el cuestionario del módulo. Opcional.</summary>
    public string? Quiz { get; set; }
}

internal sealed class QuizDocument
{
    public string Slug { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public int PassingScore { get; set; } = 70;

    public List<QuestionDocument> Questions { get; set; } = [];
}

internal sealed class QuestionDocument
{
    public string Id { get; set; } = string.Empty;

    /// <summary>single, multiple o short.</summary>
    public string Type { get; set; } = string.Empty;

    public string Prompt { get; set; } = string.Empty;

    public List<OptionDocument> Options { get; set; } = [];

    /// <summary>Respuestas aceptadas (solo short).</summary>
    public List<string> Answers { get; set; } = [];

    public string Explanation { get; set; } = string.Empty;

    public string? Hint { get; set; }

    /// <summary>Slug de la lección donde se explica el tema.</summary>
    public string? Lesson { get; set; }

    public int Points { get; set; } = 1;
}

internal sealed class OptionDocument
{
    public string Text { get; set; } = string.Empty;

    public bool Correct { get; set; }
}

/// <summary>Cabecera YAML de una lección (entre líneas <c>---</c> al principio del archivo .md).</summary>
internal sealed class LessonFrontMatter
{
    public string Slug { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public int EstimatedMinutes { get; set; }

    public string? VideoUrl { get; set; }
}

/// <summary>Lección ya leída: cabecera + las tres partes del cuerpo.</summary>
internal sealed record LessonDocument(
    string Path,
    LessonFrontMatter Meta,
    string Body,
    string PracticeActivity,
    string CheckCriteria,
    string? Transcript);
