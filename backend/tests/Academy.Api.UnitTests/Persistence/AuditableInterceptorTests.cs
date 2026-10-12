using Academy.Api.Common.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Academy.Api.UnitTests.Persistence;

public class AuditableInterceptorTests
{
    private sealed class FixedTimeProvider(DateTimeOffset now) : TimeProvider
    {
        public DateTimeOffset Now { get; set; } = now;

        public override DateTimeOffset GetUtcNow() => Now;
    }

    private sealed class Note : IAuditable
    {
        public int Id { get; set; }

        public string Text { get; set; } = string.Empty;

        public DateTimeOffset CreatedAt { get; set; }

        public DateTimeOffset UpdatedAt { get; set; }
    }

    private sealed class NotesContext(DbContextOptions<NotesContext> options) : DbContext(options)
    {
        public DbSet<Note> Notes => Set<Note>();
    }

    private static NotesContext CreateContext(TimeProvider time) =>
        new(new DbContextOptionsBuilder<NotesContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .AddInterceptors(new AuditableInterceptor(time))
            .Options);

    [Fact]
    public async Task Sets_both_timestamps_on_insert_and_only_UpdatedAt_on_update()
    {
        var created = new DateTimeOffset(2026, 10, 1, 8, 0, 0, TimeSpan.Zero);
        var time = new FixedTimeProvider(created);
        await using var db = CreateContext(time);

        var note = new Note { Text = "a" };
        db.Notes.Add(note);
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);

        Assert.Equal(created, note.CreatedAt);
        Assert.Equal(created, note.UpdatedAt);

        var updated = created.AddHours(2);
        time.Now = updated;
        note.Text = "b";
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);

        Assert.Equal(created, note.CreatedAt);
        Assert.Equal(updated, note.UpdatedAt);
    }
}
