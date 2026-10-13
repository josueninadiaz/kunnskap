using Academy.Api.Common.Persistence;
using Academy.Api.Modules.Catalog.Domain;
using Academy.Api.Modules.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Academy.Api.Modules.Assessments;

internal enum QuestionType
{
    /// <summary>Una sola opción correcta.</summary>
    SingleChoice,

    /// <summary>Varias opciones correctas: se acierta marcando exactamente esas.</summary>
    MultipleChoice,

    /// <summary>Respuesta breve que se compara sin distinguir mayúsculas, tildes ni espacios sobrantes.</summary>
    ShortAnswer,
}

/// <summary>Cuestionario al final de un módulo.</summary>
internal sealed class Quiz : IAuditable
{
    public Guid Id { get; set; } = Guid.CreateVersion7();

    public Guid ModuleId { get; set; }

    public CourseModule? Module { get; set; }

    public required string Slug { get; set; }

    public required string Title { get; set; }

    /// <summary>Porcentaje mínimo para aprobar (1–100).</summary>
    public int PassingScorePercent { get; set; } = 70;

    public List<Question> Questions { get; } = [];

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }
}

internal sealed class Question
{
    public Guid Id { get; set; } = Guid.CreateVersion7();

    public Guid QuizId { get; set; }

    public Quiz? Quiz { get; set; }

    /// <summary>
    /// Clave estable escrita en el contenido (p. ej. «punto-y-coma»). Permite reimportar el contenido
    /// sin perder el historial de intentos de las preguntas que no cambiaron de identidad.
    /// </summary>
    public required string Key { get; set; }

    public int SortOrder { get; set; }

    public QuestionType Type { get; set; }

    public required string PromptMarkdown { get; set; }

    /// <summary>Explicación: se muestra al acertar la pregunta y, al aprobar, en todas.</summary>
    public required string ExplanationMarkdown { get; set; }

    /// <summary>Pista para quien falla: orienta sin dar la respuesta.</summary>
    public string? HintMarkdown { get; set; }

    /// <summary>Lección donde se explica el tema (slug), para repasar.</summary>
    public string? LessonSlug { get; set; }

    public int Points { get; set; } = 1;

    /// <summary>Respuestas aceptadas (solo ShortAnswer). Nunca se envían al navegador antes de aprobar.</summary>
    public List<string> AcceptedAnswers { get; set; } = [];

    public List<QuestionOption> Options { get; } = [];
}

internal sealed class QuestionOption
{
    public Guid Id { get; set; } = Guid.CreateVersion7();

    public Guid QuestionId { get; set; }

    public Question? Question { get; set; }

    public int SortOrder { get; set; }

    public required string TextMarkdown { get; set; }

    /// <summary>Nunca se envía al navegador antes de que corresponda (ver QuizEndpoints).</summary>
    public bool IsCorrect { get; set; }
}

/// <summary>Intento enviado y corregido por el servidor.</summary>
internal sealed class QuizAttempt
{
    public Guid Id { get; set; } = Guid.CreateVersion7();

    public Guid UserId { get; set; }

    public Guid QuizId { get; set; }

    public Quiz? Quiz { get; set; }

    public DateTimeOffset SubmittedAt { get; set; }

    public decimal ScorePercent { get; set; }

    public bool Passed { get; set; }

    public List<AttemptAnswer> Answers { get; } = [];
}

internal sealed class AttemptAnswer
{
    public Guid AttemptId { get; set; }

    public Guid QuestionId { get; set; }

    public List<Guid> SelectedOptionIds { get; set; } = [];

    public string? TextAnswer { get; set; }

    public bool IsCorrect { get; set; }

    public int PointsAwarded { get; set; }
}

internal sealed class QuizConfiguration : IEntityTypeConfiguration<Quiz>
{
    public void Configure(EntityTypeBuilder<Quiz> builder)
    {
        builder.ToTable("quizzes", t => t.HasCheckConstraint("ck_quizzes_passing_score", "passing_score_percent BETWEEN 1 AND 100"));
        builder.Property(q => q.Slug).HasMaxLength(120);
        builder.Property(q => q.Title).HasMaxLength(200);
        // Un cuestionario por módulo, y slugs únicos dentro de la plataforma para URLs estables.
        builder.HasIndex(q => q.ModuleId).IsUnique();
        builder.HasIndex(q => q.Slug).IsUnique();
        builder.HasOne(q => q.Module).WithMany().HasForeignKey(q => q.ModuleId).OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class QuestionConfiguration : IEntityTypeConfiguration<Question>
{
    public void Configure(EntityTypeBuilder<Question> builder)
    {
        builder.ToTable(t => t.HasCheckConstraint("ck_questions_points", "points > 0"));
        builder.Property(q => q.Type).HasConversion<string>().HasMaxLength(20);
        builder.Property(q => q.LessonSlug).HasMaxLength(120);
        builder.Property(q => q.Key).HasMaxLength(60);
        builder.HasIndex(q => new { q.QuizId, q.SortOrder }).IsUnique();
        builder.HasIndex(q => new { q.QuizId, q.Key }).IsUnique();
        builder.HasOne(q => q.Quiz).WithMany(z => z.Questions).HasForeignKey(q => q.QuizId).OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class QuestionOptionConfiguration : IEntityTypeConfiguration<QuestionOption>
{
    public void Configure(EntityTypeBuilder<QuestionOption> builder)
    {
        builder.ToTable("question_options");
        builder.HasIndex(o => new { o.QuestionId, o.SortOrder }).IsUnique();
        builder.HasOne(o => o.Question).WithMany(q => q.Options).HasForeignKey(o => o.QuestionId).OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class QuizAttemptConfiguration : IEntityTypeConfiguration<QuizAttempt>
{
    public void Configure(EntityTypeBuilder<QuizAttempt> builder)
    {
        builder.ToTable("quiz_attempts", t => t.HasCheckConstraint("ck_quiz_attempts_score", "score_percent BETWEEN 0 AND 100"));
        builder.Property(a => a.ScorePercent).HasPrecision(5, 2);
        // Historial de una persona en un cuestionario, del más reciente al más antiguo.
        builder.HasIndex(a => new { a.UserId, a.QuizId, a.SubmittedAt });
        builder.HasOne<User>().WithMany().HasForeignKey(a => a.UserId).OnDelete(DeleteBehavior.Cascade);
        // Si se elimina un cuestionario del contenido, sus intentos se eliminan con él.
        builder.HasOne(a => a.Quiz).WithMany().HasForeignKey(a => a.QuizId).OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class AttemptAnswerConfiguration : IEntityTypeConfiguration<AttemptAnswer>
{
    public void Configure(EntityTypeBuilder<AttemptAnswer> builder)
    {
        builder.ToTable("attempt_answers");
        builder.HasKey(a => new { a.AttemptId, a.QuestionId });
        builder.Property(a => a.TextAnswer).HasMaxLength(200);
        builder.HasOne<QuizAttempt>().WithMany(a => a.Answers).HasForeignKey(a => a.AttemptId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<Question>().WithMany().HasForeignKey(a => a.QuestionId).OnDelete(DeleteBehavior.Cascade);
    }
}
