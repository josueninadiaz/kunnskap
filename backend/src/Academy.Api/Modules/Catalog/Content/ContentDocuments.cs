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
}
