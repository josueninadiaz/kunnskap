using Academy.Api.Modules.Assessments;

namespace Academy.Api.UnitTests.Assessments;

public class GradingTests
{
    [Theory]
    [InlineData("  DOTNET   run hola.cs ", "dotnet run hola.cs")]
    [InlineData("Se esperaba ;", "se esperaba ;")]
    [InlineData("Lección.", "leccion")]
    [InlineData("CS1002", "cs1002")]
    public void Short_answers_ignore_case_accents_extra_spaces_and_final_period(string input, string expected)
    {
        Assert.Equal(expected, Grading.NormalizeShortAnswer(input));
    }

    private static Question Choice(QuestionType type, params bool[] correct)
    {
        var q = new Question { Key = "q", Type = type, PromptMarkdown = "?", ExplanationMarkdown = "!" };
        for (var i = 0; i < correct.Length; i++)
        {
            q.Options.Add(new QuestionOption { Id = Guid.NewGuid(), TextMarkdown = $"{i}", IsCorrect = correct[i], SortOrder = i + 1 });
        }

        return q;
    }

    [Fact]
    public void Multiple_choice_requires_exactly_the_correct_options()
    {
        var q = Choice(QuestionType.MultipleChoice, true, true, false);
        Guid Id(int i) => q.Options[i].Id;

        Assert.True(Grading.IsCorrect(q, [Id(0), Id(1)], null));
        Assert.False(Grading.IsCorrect(q, [Id(0)], null));
        Assert.False(Grading.IsCorrect(q, [Id(0), Id(1), Id(2)], null));
        Assert.False(Grading.IsCorrect(q, [], null));
    }

    [Fact]
    public void Short_answers_match_any_accepted_answer()
    {
        var q = new Question { Key = "q", Type = QuestionType.ShortAnswer, PromptMarkdown = "?", ExplanationMarkdown = "!", AcceptedAnswers = ["CS1002", "error CS1002"] };

        Assert.True(Grading.IsCorrect(q, [], "cs1002"));
        Assert.True(Grading.IsCorrect(q, [], " Error CS1002 "));
        Assert.False(Grading.IsCorrect(q, [], "CS1003"));
        Assert.False(Grading.IsCorrect(q, [], "  "));
    }

    [Theory]
    [InlineData(2, 3, 66.66)]
    [InlineData(3, 3, 100)]
    [InlineData(0, 3, 0)]
    [InlineData(0, 0, 0)]
    public void Score_is_rounded_down_so_nobody_passes_by_rounding(int awarded, int total, double expected)
    {
        Assert.Equal((decimal)expected, Grading.ScorePercent(awarded, total));
    }
}
