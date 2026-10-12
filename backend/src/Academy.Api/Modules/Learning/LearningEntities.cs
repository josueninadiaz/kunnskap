using Academy.Api.Modules.Catalog.Domain;
using Academy.Api.Modules.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Academy.Api.Modules.Learning;

/// <summary>Inscripción gratuita de una persona en un curso.</summary>
internal sealed class Enrollment
{
    public Guid Id { get; set; } = Guid.CreateVersion7();

    public Guid UserId { get; set; }

    public User? User { get; set; }

    public Guid CourseId { get; set; }

    public Course? Course { get; set; }

    public DateTimeOffset EnrolledAt { get; set; }

    /// <summary>Se rellena al completar todas las lecciones publicadas; se vacía si se publican lecciones nuevas.</summary>
    public DateTimeOffset? CompletedAt { get; set; }

    /// <summary>Última lección visitada: el punto desde el que continuar.</summary>
    public Guid? LastLessonId { get; set; }

    public Lesson? LastLesson { get; set; }

    public DateTimeOffset LastActivityAt { get; set; }
}

/// <summary>Progreso de una persona en una lección.</summary>
internal sealed class LessonProgress
{
    public Guid UserId { get; set; }

    public Guid LessonId { get; set; }

    public Lesson? Lesson { get; set; }

    public DateTimeOffset FirstViewedAt { get; set; }

    public DateTimeOffset? CompletedAt { get; set; }
}

internal sealed class EnrollmentConfiguration : IEntityTypeConfiguration<Enrollment>
{
    public void Configure(EntityTypeBuilder<Enrollment> builder)
    {
        builder.HasIndex(e => new { e.UserId, e.CourseId }).IsUnique();

        builder.HasOne(e => e.User).WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);

        // Un curso con inscripciones no se puede borrar: se archiva.
        builder.HasOne(e => e.Course).WithMany().HasForeignKey(e => e.CourseId).OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.LastLesson).WithMany().HasForeignKey(e => e.LastLessonId).OnDelete(DeleteBehavior.SetNull);
    }
}

internal sealed class LessonProgressConfiguration : IEntityTypeConfiguration<LessonProgress>
{
    public void Configure(EntityTypeBuilder<LessonProgress> builder)
    {
        builder.ToTable("lesson_progress");
        builder.HasKey(p => new { p.UserId, p.LessonId });

        builder.HasOne<User>().WithMany().HasForeignKey(p => p.UserId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(p => p.Lesson).WithMany().HasForeignKey(p => p.LessonId).OnDelete(DeleteBehavior.Cascade);
    }
}
