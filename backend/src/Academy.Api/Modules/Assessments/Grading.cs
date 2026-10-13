using System.Globalization;
using System.Text;

namespace Academy.Api.Modules.Assessments;

/// <summary>Corrección de preguntas (reglas puras, probadas con pruebas unitarias).</summary>
internal static class Grading
{
    /// <summary>
    /// Normaliza una respuesta breve: sin tildes, en minúsculas, sin espacios sobrantes ni puntuación
    /// final. «  Se esperaba ; » y «se ESPERABA ;» se consideran iguales.
    /// </summary>
    public static string NormalizeShortAnswer(string value)
    {
        var decomposed = value.Trim().Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(decomposed.Length);
        var lastWasSpace = false;

        foreach (var c in decomposed)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) == UnicodeCategory.NonSpacingMark)
            {
                continue;
            }

            if (char.IsWhiteSpace(c))
            {
                if (!lastWasSpace)
                {
                    builder.Append(' ');
                }

                lastWasSpace = true;
                continue;
            }

            builder.Append(char.ToLowerInvariant(c));
            lastWasSpace = false;
        }

        return builder.ToString().Trim().TrimEnd('.');
    }

    public static bool IsCorrect(Question question, IReadOnlyCollection<Guid> selectedOptionIds, string? text) =>
        question.Type switch
        {
            QuestionType.SingleChoice or QuestionType.MultipleChoice =>
                selectedOptionIds.Count > 0 &&
                question.Options.Where(o => o.IsCorrect).Select(o => o.Id).ToHashSet().SetEquals(selectedOptionIds),
            QuestionType.ShortAnswer =>
                !string.IsNullOrWhiteSpace(text) &&
                question.AcceptedAnswers.Any(a => NormalizeShortAnswer(a) == NormalizeShortAnswer(text)),
            _ => false,
        };

    /// <summary>Porcentaje con dos decimales, redondeado hacia abajo para no aprobar por redondeo.</summary>
    public static decimal ScorePercent(int awarded, int total) =>
        total == 0 ? 0 : Math.Floor(awarded * 10000m / total) / 100m;
}
