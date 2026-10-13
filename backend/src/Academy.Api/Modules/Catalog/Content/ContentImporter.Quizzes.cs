using Academy.Api.Modules.Assessments;
using Academy.Api.Modules.Catalog.Domain;
using Microsoft.EntityFrameworkCore;

namespace Academy.Api.Modules.Catalog.Content;

/// <summary>Cuestionarios de módulo: lectura, validación y sincronización conservando los intentos.</summary>
internal sealed partial class ContentImporter
{
    private static readonly Dictionary<string, QuestionType> QuestionTypes = new(StringComparer.Ordinal)
    {
        ["single"] = QuestionType.SingleChoice,
        ["multiple"] = QuestionType.MultipleChoice,
        ["short"] = QuestionType.ShortAnswer,
    };

    private static List<QuizDocument?> LoadQuizzes(string contentPath, string coursePath, CourseDocument course, List<string> errors)
    {
        var courseDir = System.IO.Path.GetDirectoryName(coursePath)!;
        return course.Modules
            .Select(module => string.IsNullOrWhiteSpace(module.Quiz)
                ? null
                : Load<QuizDocument>(contentPath, System.IO.Path.Combine(courseDir, module.Quiz).Replace('\\', '/'), errors))
            .ToList();
    }

    private static void ValidateQuizzes(List<CourseSource> courses, List<string> errors)
    {
        var allQuizzes = courses.SelectMany(c => c.ModuleQuizzes.OfType<QuizDocument>()).ToList();
        CheckUniqueSlugs("cuestionarios", allQuizzes.Select(q => q.Slug), errors);

        foreach (var course in courses)
        {
            var lessonSlugs = course.ModuleLessons.SelectMany(m => m).Select(l => l.Meta.Slug).ToHashSet(StringComparer.Ordinal);

            for (var m = 0; m < course.ModuleQuizzes.Count; m++)
            {
                if (course.ModuleQuizzes[m] is not { } quiz)
                {
                    continue;
                }

                var where = $"{course.Path} (cuestionario del módulo {m + 1})";
                CheckSlug(where, quiz.Slug, errors);
                CheckText(where, "title", quiz.Title, 200, errors);

                if (quiz.PassingScore is < 1 or > 100)
                {
                    errors.Add($"{where}: passingScore debe estar entre 1 y 100.");
                }

                if (quiz.Questions.Count == 0)
                {
                    errors.Add($"{where}: necesita al menos una pregunta.");
                }

                CheckUniqueSlugs($"{where} (preguntas)", quiz.Questions.Select(q => q.Id), errors);

                for (var i = 0; i < quiz.Questions.Count; i++)
                {
                    ValidateQuestion($"{where}, pregunta {i + 1}", quiz.Questions[i], lessonSlugs, errors);
                }
            }
        }
    }

    private static void ValidateQuestion(string where, QuestionDocument q, HashSet<string> lessonSlugs, List<string> errors)
    {
        CheckSlug(where, q.Id, errors);
        CheckText(where, "prompt", q.Prompt, 2000, errors);
        CheckText(where, "explanation", q.Explanation, 2000, errors);

        if (q.Points <= 0)
        {
            errors.Add($"{where}: points debe ser mayor que 0.");
        }

        if (q.Lesson is not null && !lessonSlugs.Contains(q.Lesson))
        {
            errors.Add($"{where}: la lección «{q.Lesson}» no existe en este curso.");
        }

        if (!QuestionTypes.TryGetValue(q.Type, out var type))
        {
            errors.Add($"{where}: type debe ser single, multiple o short.");
            return;
        }

        var correct = q.Options.Count(o => o.Correct);
        switch (type)
        {
            case QuestionType.SingleChoice when q.Options.Count < 2 || correct != 1:
                errors.Add($"{where}: una pregunta single necesita al menos 2 opciones y exactamente 1 correcta.");
                break;
            case QuestionType.MultipleChoice when q.Options.Count < 2 || correct < 1:
                errors.Add($"{where}: una pregunta multiple necesita al menos 2 opciones y al menos 1 correcta.");
                break;
            case QuestionType.ShortAnswer when q.Answers.Count == 0 || q.Options.Count > 0:
                errors.Add($"{where}: una pregunta short necesita answers y no admite options.");
                break;
        }

        foreach (var option in q.Options.Where(o => string.IsNullOrWhiteSpace(o.Text)))
        {
            errors.Add($"{where}: hay una opción sin texto.");
        }
    }

    private async Task<List<Quiz>> LoadExistingQuizzesAsync(List<CourseSource> documents, CancellationToken ct)
    {
        var quizSlugs = documents.SelectMany(d => d.ModuleQuizzes.OfType<QuizDocument>()).Select(q => q.Slug).ToList();
        var courseSlugs = documents.Select(d => d.Doc.Slug).ToList();

        return await db.Quizzes
            .Include(q => q.Questions).ThenInclude(q => q.Options)
            .Where(q => quizSlugs.Contains(q.Slug) || courseSlugs.Contains(q.Module!.Course!.Slug))
            .AsSplitQuery()
            .ToListAsync(ct);
    }

    /// <summary>
    /// Sincroniza el cuestionario de cada módulo. Las preguntas se identifican por su clave (id en el
    /// YAML) y las opciones por su posición, así los intentos anteriores se conservan.
    /// </summary>
    private void SyncQuizzes(Course course, List<QuizDocument?> documents, List<Quiz> existing, List<Action> finalizers)
    {
        var modules = course.Modules.OrderBy(m => m.SortOrder).ToList();

        for (var m = 0; m < modules.Count; m++)
        {
            var module = modules[m];
            var doc = m < documents.Count ? documents[m] : null;
            var current = existing.FirstOrDefault(q => q.ModuleId == module.Id && module.Id != Guid.Empty);

            if (doc is null)
            {
                if (current is not null)
                {
                    db.Quizzes.Remove(current);
                }

                continue;
            }

            var quiz = existing.FirstOrDefault(q => q.Slug == doc.Slug) ?? current;
            if (quiz is null)
            {
                quiz = new Quiz { Slug = doc.Slug, Title = doc.Title };
                db.Quizzes.Add(quiz);
                existing.Add(quiz);
            }
            else if (current is not null && current != quiz)
            {
                db.Quizzes.Remove(current);
            }

            quiz.Module = module;
            quiz.Slug = doc.Slug;
            quiz.Title = doc.Title.Trim();
            quiz.PassingScorePercent = doc.PassingScore;
            SyncQuestions(quiz, doc.Questions, finalizers);
        }
    }

    private void SyncQuestions(Quiz quiz, List<QuestionDocument> documents, List<Action> finalizers)
    {
        var byKey = quiz.Questions.ToDictionary(q => q.Key, StringComparer.Ordinal);
        var keep = documents.Select(d => d.Id).ToHashSet(StringComparer.Ordinal);

        foreach (var removed in quiz.Questions.Where(q => !keep.Contains(q.Key)).ToList())
        {
            db.Questions.Remove(removed);
        }

        for (var i = 0; i < documents.Count; i++)
        {
            var doc = documents[i];
            if (!byKey.TryGetValue(doc.Id, out var question))
            {
                question = new Question { Key = doc.Id, PromptMarkdown = doc.Prompt, ExplanationMarkdown = doc.Explanation };
                quiz.Questions.Add(question);
                db.Questions.Add(question);
            }

            question.Type = QuestionTypes[doc.Type];
            question.PromptMarkdown = doc.Prompt.Trim();
            question.ExplanationMarkdown = doc.Explanation.Trim();
            question.HintMarkdown = doc.Hint?.Trim();
            question.LessonSlug = doc.Lesson;
            question.Points = doc.Points;
            question.AcceptedAnswers = [.. doc.Answers.Select(a => a.Trim())];

            // Posición provisional (negativa) para que reordenar no choque con el índice único.
            question.SortOrder = -(i + 1);
            var finalQuestion = question;
            var finalOrder = i + 1;
            finalizers.Add(() => finalQuestion.SortOrder = finalOrder);

            SyncOptions(question, doc.Options);
        }
    }

    private void SyncOptions(Question question, List<OptionDocument> documents)
    {
        var current = question.Options.OrderBy(o => o.SortOrder).ToList();

        for (var i = 0; i < documents.Count; i++)
        {
            var option = i < current.Count ? current[i] : null;
            if (option is null)
            {
                option = new QuestionOption { TextMarkdown = documents[i].Text };
                question.Options.Add(option);
                db.QuestionOptions.Add(option);
            }

            option.TextMarkdown = documents[i].Text.Trim();
            option.IsCorrect = documents[i].Correct;
            option.SortOrder = i + 1;
        }

        foreach (var extra in current.Skip(documents.Count))
        {
            db.QuestionOptions.Remove(extra);
        }
    }
}
