import { prisma } from "./db";
import { isCorrect } from "./answer-matcher";
import type { Question } from "@prisma/client";

// Malayalam MCQ uses the parallel acceptedAnswersMl. Numbers are language-neutral
// and reuse acceptedAnswers in either language. Text only exists in monolingual
// quizzes (bilingual validation rejects it).
function pickAccepted(question: Question, lang: "en" | "ml"): string[] {
  if (lang === "ml" && question.answerType === "mcq" && question.acceptedAnswersMl.length > 0) {
    return question.acceptedAnswersMl;
  }
  return question.acceptedAnswers;
}

/**
 * Backfill rawScore for any of a user's completed attempts that still have
 * null rawScore (e.g. legacy attempts submitted before scoring-on-complete).
 */
export async function backfillAttemptScores(userId: string) {
  const attempts = await prisma.attempt.findMany({
    where: { userId, isComplete: true, archivedAt: null, rawScore: null },
    include: {
      answers: true,
      quiz: { include: { questions: true } },
    },
  });

  for (const attempt of attempts) {
    const lang = attempt.language === "ml" ? "ml" : "en";
    let correct = 0;
    for (const question of attempt.quiz.questions) {
      const userAnswers = attempt.answers.filter((a) => a.questionId === question.id);
      const userAnswer = userAnswers[userAnswers.length - 1];
      if (userAnswer?.submittedText) {
        const ok = isCorrect(
          userAnswer.submittedText,
          pickAccepted(question, lang),
          question.answerType as "text" | "number" | "mcq"
        );
        for (const ans of userAnswers) {
          if (ans.manuallyOverridden) {
            if (ans.id === userAnswer.id && ans.isCorrect) correct++;
            continue;
          }
          const newIsCorrect = ans.id === userAnswer.id ? ok : false;
          await prisma.answer.update({
            where: { id: ans.id },
            data: { isCorrect: newIsCorrect },
          });
          if (newIsCorrect) correct++;
        }
      } else {
        for (const ans of userAnswers) {
          if (ans.manuallyOverridden) {
            if (ans.isCorrect) correct++;
            continue;
          }
          await prisma.answer.update({
            where: { id: ans.id },
            data: { isCorrect: false },
          });
        }
      }
    }
    await prisma.attempt.update({
      where: { id: attempt.id },
      data: { rawScore: correct },
    });
  }
}

/**
 * Re-grade every completed non-archived attempt for a quiz. Used after the
 * window closes (or after edits) to refresh per-answer isCorrect and the
 * attempt rawScore. Aggregate user scores are now derived live from these
 * values, so there's nothing else to update here.
 */
export async function processQuizResults(quizId: string) {
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  if (!quiz) return;

  const quizQuestions = await prisma.question.findMany({
    where: { quizId },
  });

  const allAttempts = await prisma.attempt.findMany({
    where: { quizId, isComplete: true, archivedAt: null },
    include: { answers: true },
  });

  for (const attempt of allAttempts) {
    const lang = attempt.language === "ml" ? "ml" : "en";
    let correctCount = 0;

    for (const ans of attempt.answers) {
      if (ans.manuallyOverridden) {
        if (ans.isCorrect) correctCount++;
        continue;
      }

      const question = quizQuestions.find((q) => q.id === ans.questionId);
      if (!question || !ans.submittedText) {
        await prisma.answer.update({
          where: { id: ans.id },
          data: { isCorrect: false },
        });
        continue;
      }

      const correct = isCorrect(
        ans.submittedText,
        pickAccepted(question, lang),
        question.answerType as "text" | "number" | "mcq"
      );

      await prisma.answer.update({
        where: { id: ans.id },
        data: { isCorrect: correct },
      });

      if (correct) correctCount++;
    }

    await prisma.attempt.update({
      where: { id: attempt.id },
      data: { rawScore: correctCount },
    });
  }

  await prisma.quiz.update({
    where: { id: quizId },
    data: { resultsProcessed: true },
  });
}
