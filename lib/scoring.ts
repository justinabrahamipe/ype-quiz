import { prisma } from "./db";
import { isCorrect } from "./answer-matcher";

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
    let correct = 0;
    for (const question of attempt.quiz.questions) {
      const userAnswers = attempt.answers.filter((a) => a.questionId === question.id);
      const userAnswer = userAnswers[userAnswers.length - 1];
      if (userAnswer?.submittedText) {
        const ok = isCorrect(
          userAnswer.submittedText,
          question.acceptedAnswers,
          question.answerType as "text" | "number"
        );
        if (ok) correct++;
        for (const ans of userAnswers) {
          await prisma.answer.update({
            where: { id: ans.id },
            data: { isCorrect: ans.id === userAnswer.id ? ok : false },
          });
        }
      } else {
        for (const ans of userAnswers) {
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
    let correctCount = 0;

    for (const ans of attempt.answers) {
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
        question.acceptedAnswers,
        question.answerType as "text" | "number"
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

  const sortedAttempts = await prisma.attempt.findMany({
    where: { quizId, isComplete: true, archivedAt: null },
    orderBy: { completedAt: "asc" },
  });

  // Update overall scores for participants
  for (const attempt of sortedAttempts) {
    await updateOverallScore(attempt.userId);
  }

  await prisma.quiz.update({
    where: { id: quizId },
    data: { resultsProcessed: true },
  });
}

export async function processPenalties(quizId: string) {
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  if (!quiz) return;

  // Users who joined before quiz started
  const eligibleUsers = await prisma.user.findMany({
    where: { createdAt: { lt: quiz.startTime } },
  });

  // Users who have an attempt
  const attemptedUsers = await prisma.attempt.findMany({
    where: { quizId },
    select: { userId: true },
  });
  const attemptedIds = new Set(attemptedUsers.map((a) => a.userId));

  for (const user of eligibleUsers) {
    if (attemptedIds.has(user.id)) continue;

    const existing = await prisma.overallScore.findUnique({
      where: { userId: user.id },
    });

    if (!existing) {
      await prisma.overallScore.create({
        data: {
          userId: user.id,
          totalScore: 0,
          quizzesAttempted: 0,
          quizzesMissed: 1,
        },
      });
    } else {
      await prisma.overallScore.update({
        where: { userId: user.id },
        data: {
          quizzesMissed: { increment: 1 },
          lastUpdated: new Date(),
        },
      });
    }
  }

  await prisma.quiz.update({
    where: { id: quizId },
    data: { penaltyProcessed: true },
  });
}

export async function updateOverallScore(userId: string) {
  const userAttempts = await prisma.attempt.findMany({
    where: {
      userId,
      isComplete: true,
      archivedAt: null,
    },
  });

  let totalScore = 0;
  let quizzesAttempted = 0;

  for (const attempt of userAttempts) {
    totalScore += Number(attempt.rawScore ?? 0);
    quizzesAttempted++;
  }

  const existing = await prisma.overallScore.findUnique({
    where: { userId },
  });

  const missedCount = existing?.quizzesMissed ?? 0;

  await prisma.overallScore.upsert({
    where: { userId },
    create: {
      userId,
      totalScore,
      quizzesAttempted,
      quizzesMissed: missedCount,
      lastUpdated: new Date(),
    },
    update: {
      totalScore,
      quizzesAttempted,
      lastUpdated: new Date(),
    },
  });
}
