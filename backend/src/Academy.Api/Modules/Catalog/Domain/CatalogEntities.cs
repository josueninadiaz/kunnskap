using Academy.Api.Common.Persistence;

namespace Academy.Api.Modules.Catalog.Domain;

internal enum CourseLevel
{
    Beginner,
    Intermediate,
    Advanced,
}

/// <summary>
/// Estado editorial. <see cref="InDevelopment"/> se muestra en el catálogo claramente marcado
/// como "en preparación" y no admite inscripciones; <see cref="Draft"/> solo es visible para editores.
/// </summary>
internal enum ContentStatus
{
    Draft,
    InDevelopment,
    Published,
    Archived,
}

internal sealed class School : IAuditable
{
    public Guid Id { get; set; } = Guid.CreateVersion7();

    public required string Slug { get; set; }

    public required string Name { get; set; }

    public required string Description { get; set; }

    public int SortOrder { get; set; }

    public List<Course> Courses { get; } = [];

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }
}

internal sealed class Technology
{
    public Guid Id { get; set; } = Guid.CreateVersion7();

    public required string Slug { get; set; }

    public required string Name { get; set; }

    public List<Course> Courses { get; } = [];
}

internal sealed class Course : IAuditable
{
    public Guid Id { get; set; } = Guid.CreateVersion7();

    public Guid SchoolId { get; set; }

    public School? School { get; set; }

    public required string Slug { get; set; }

    public required string Title { get; set; }

    public required string Summary { get; set; }

    public required string DescriptionMarkdown { get; set; }

    public CourseLevel Level { get; set; }

    public ContentStatus Status { get; set; } = ContentStatus.Draft;

    /// <summary>Posición dentro de la escuela.</summary>
    public int SortOrder { get; set; }

    /// <summary>Duración estimada. Opcional mientras el curso no está publicado: no se inventan duraciones.</summary>
    public int? EstimatedMinutes { get; set; }

    /// <summary>
    /// Ruta del archivo en <c>content/</c> si el curso se gestiona desde el repositorio (ADR 0003);
    /// null si se creó desde el panel de administración.
    /// </summary>
    public string? SourcePath { get; set; }

    public string Language { get; set; } = "es";

    /// <summary>Identificador SPDX de la licencia del contenido (por defecto CC BY-SA 4.0).</summary>
    public string LicenseSpdx { get; set; } = "CC-BY-SA-4.0";

    public List<string> LearningObjectives { get; set; } = [];

    public List<string> Prerequisites { get; set; } = [];

    public List<string> Authors { get; set; } = [];

    /// <summary>Versiones del software usado en el curso, p. ej. ".NET 10", "Node.js 24".</summary>
    public List<string> SoftwareVersions { get; set; } = [];

    public DateTimeOffset? LastReviewedAt { get; set; }

    public DateTimeOffset? PublishedAt { get; set; }

    public List<CourseModule> Modules { get; } = [];

    public List<Technology> Technologies { get; } = [];

    /// <summary>Token de concurrencia optimista (columna de sistema <c>xmin</c> de PostgreSQL).</summary>
    public uint Version { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }
}

internal sealed class CourseModule
{
    public Guid Id { get; set; } = Guid.CreateVersion7();

    public Guid CourseId { get; set; }

    public Course? Course { get; set; }

    public required string Title { get; set; }

    public string Summary { get; set; } = string.Empty;

    public int SortOrder { get; set; }

    public List<Lesson> Lessons { get; } = [];
}

internal sealed class Lesson : IAuditable
{
    public Guid Id { get; set; } = Guid.CreateVersion7();

    public Guid ModuleId { get; set; }

    public CourseModule? Module { get; set; }

    public required string Slug { get; set; }

    public required string Title { get; set; }

    public required string BodyMarkdown { get; set; }

    public string PracticeActivityMarkdown { get; set; } = string.Empty;

    public string CheckCriteriaMarkdown { get; set; } = string.Empty;

    /// <summary>Video opcional. La lección debe ser comprensible sin él.</summary>
    public Uri? VideoUrl { get; set; }

    public string? TranscriptMarkdown { get; set; }

    public int EstimatedMinutes { get; set; }

    public int SortOrder { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }
}
