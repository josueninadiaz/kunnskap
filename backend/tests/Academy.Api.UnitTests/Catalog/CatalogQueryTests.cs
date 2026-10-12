using Academy.Api.Modules.Catalog;

namespace Academy.Api.UnitTests.Catalog;

public class CatalogQueryTests
{
    [Theory]
    [InlineData("logica", "%logica%")]
    [InlineData("100%", @"%100\%%")]
    [InlineData("a_b", @"%a\_b%")]
    [InlineData(@"c:\temp", @"%c:\\temp%")]
    public void Search_terms_escape_like_wildcards(string term, string expected)
    {
        Assert.Equal(expected, CatalogQuery.ContainsPattern(term));
    }

    [Theory]
    [InlineData("corto", 1, 600)]
    [InlineData("MEDIO", 601, 1800)]
    [InlineData("largo", 1801, int.MaxValue)]
    public void Duration_filters_map_to_minute_ranges(string value, int min, int max)
    {
        var errors = new Dictionary<string, string[]>();

        Assert.Equal((min, max), CatalogQuery.ParseDuration(value, errors));
        Assert.Empty(errors);
    }

    [Fact]
    public void Unknown_duration_is_reported_as_validation_error()
    {
        var errors = new Dictionary<string, string[]>();

        Assert.Null(CatalogQuery.ParseDuration("eterno", errors));
        Assert.True(errors.ContainsKey("duration"));
    }

    [Fact]
    public void Duration_ranges_do_not_overlap_or_leave_gaps()
    {
        var ranges = CatalogQuery.DurationRanges.Values.OrderBy(r => r.Min).ToList();

        for (var i = 1; i < ranges.Count; i++)
        {
            Assert.Equal(ranges[i - 1].Max + 1, ranges[i].Min);
        }
    }
}
