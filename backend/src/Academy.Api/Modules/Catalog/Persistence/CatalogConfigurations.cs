using Academy.Api.Modules.Catalog.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Academy.Api.Modules.Catalog.Persistence;

internal sealed class SchoolConfiguration : IEntityTypeConfiguration<School>
{
    public void Configure(EntityTypeBuilder<School> builder)
    {
        builder.Property(s => s.Slug).HasMaxLength(80);
        builder.HasIndex(s => s.Slug).IsUnique();
        builder.Property(s => s.Name).HasMaxLength(160);
    }
}

internal sealed class TechnologyConfiguration : IEntityTypeConfiguration<Technology>
{
    public void Configure(EntityTypeBuilder<Technology> builder)
    {
        builder.Property(t => t.Slug).HasMaxLength(60);
        builder.HasIndex(t => t.Slug).IsUnique();
        builder.Property(t => t.Name).HasMaxLength(80);
    }
}

internal sealed class CourseConfiguration : IEntityTypeConfiguration<Course>
{
    public void Configure(EntityTypeBuilder<Course> builder)
    {
        builder.ToTable(t =>
        {
            t.HasCheckConstraint("ck_courses_estimated_minutes", "estimated_minutes IS NULL OR estimated_minutes > 0");
            t.HasCheckConstraint("ck_courses_published_duration", "status <> 'Published' OR estimated_minutes IS NOT NULL");
            t.HasCheckConstraint("ck_courses_level", "level IN ('Beginner', 'Intermediate', 'Advanced')");
            t.HasCheckConstraint("ck_courses_status", "status IN ('Draft', 'InDevelopment', 'Published', 'Archived')");
            t.HasCheckConstraint("ck_courses_published_at", "status <> 'Published' OR published_at IS NOT NULL");
        });

        builder.Property(c => c.Slug).HasMaxLength(120);
        builder.HasIndex(c => c.Slug).IsUnique();
        builder.Property(c => c.Title).HasMaxLength(200);
        builder.Property(c => c.Summary).HasMaxLength(500);
        builder.Property(c => c.Level).HasConversion<string>().HasMaxLength(20);
        builder.Property(c => c.Status).HasConversion<string>().HasMaxLength(20);
        builder.Property(c => c.Language).HasMaxLength(10);
        builder.Property(c => c.LicenseSpdx).HasMaxLength(40);
        builder.Property(c => c.SourcePath).HasMaxLength(300);
        builder.Property(c => c.Version).IsRowVersion();

        // Filtros habituales del catálogo: cursos visibles por escuela.
        builder.HasIndex(c => new { c.Status, c.SchoolId, c.SortOrder });

        builder.HasOne(c => c.School)
            .WithMany(s => s.Courses)
            .HasForeignKey(c => c.SchoolId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(c => c.Technologies)
            .WithMany(t => t.Courses)
            .UsingEntity("course_technologies");
    }
}

internal sealed class CourseModuleConfiguration : IEntityTypeConfiguration<CourseModule>
{
    public void Configure(EntityTypeBuilder<CourseModule> builder)
    {
        builder.ToTable("course_modules");
        builder.Property(m => m.Title).HasMaxLength(200);
        builder.Property(m => m.Summary).HasMaxLength(1000);
        builder.HasIndex(m => new { m.CourseId, m.SortOrder }).IsUnique();

        builder.HasOne(m => m.Course)
            .WithMany(c => c.Modules)
            .HasForeignKey(m => m.CourseId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class LessonConfiguration : IEntityTypeConfiguration<Lesson>
{
    public void Configure(EntityTypeBuilder<Lesson> builder)
    {
        builder.ToTable(t => t.HasCheckConstraint("ck_lessons_estimated_minutes", "estimated_minutes > 0"));

        builder.Property(l => l.Slug).HasMaxLength(120);
        builder.Property(l => l.Title).HasMaxLength(200);
        builder.Property(l => l.VideoUrl).HasMaxLength(2048);
        builder.HasIndex(l => new { l.ModuleId, l.SortOrder }).IsUnique();
        builder.HasIndex(l => new { l.ModuleId, l.Slug }).IsUnique();

        builder.HasOne(l => l.Module)
            .WithMany(m => m.Lessons)
            .HasForeignKey(l => l.ModuleId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
