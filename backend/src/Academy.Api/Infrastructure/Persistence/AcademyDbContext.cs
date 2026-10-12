using Academy.Api.Modules.Catalog.Domain;
using Academy.Api.Modules.Identity;
using Academy.Api.Modules.Learning;
using Microsoft.AspNetCore.DataProtection.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Academy.Api.Infrastructure.Persistence;

internal sealed class AcademyDbContext(DbContextOptions<AcademyDbContext> options)
    : IdentityDbContext<User, Role, Guid>(options), IDataProtectionKeyContext
{
    /// <summary>Claves de ASP.NET Core Data Protection (cifran cookies de sesión y tokens antiforgery).</summary>
    public DbSet<DataProtectionKey> DataProtectionKeys => Set<DataProtectionKey>();

    public DbSet<School> Schools => Set<School>();

    public DbSet<Technology> Technologies => Set<Technology>();

    public DbSet<Course> Courses => Set<Course>();

    public DbSet<CourseModule> CourseModules => Set<CourseModule>();

    public DbSet<Lesson> Lessons => Set<Lesson>();

    public DbSet<Enrollment> Enrollments => Set<Enrollment>();

    public DbSet<LessonProgress> LessonProgress => Set<LessonProgress>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Búsqueda sin distinguir tildes en el catálogo ("logica" encuentra "Lógica").
        builder.HasPostgresExtension("unaccent");

        // Nombres de tabla legibles para Identity en lugar de "asp_net_users", etc.
        builder.Entity<User>(b =>
        {
            b.ToTable("users");
            b.Property(u => u.DisplayName).HasMaxLength(80);
            b.Property(u => u.PreferredLanguage).HasMaxLength(10);
        });
        builder.Entity<Role>().ToTable("roles");
        builder.Entity<IdentityUserRole<Guid>>().ToTable("user_roles");
        builder.Entity<IdentityUserClaim<Guid>>().ToTable("user_claims");
        builder.Entity<IdentityUserLogin<Guid>>().ToTable("user_logins");
        builder.Entity<IdentityUserToken<Guid>>().ToTable("user_tokens");
        builder.Entity<IdentityRoleClaim<Guid>>().ToTable("role_claims");

        builder.ApplyConfigurationsFromAssembly(typeof(AcademyDbContext).Assembly);
    }
}
