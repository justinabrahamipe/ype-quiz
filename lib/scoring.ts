import { prisma } from "./db";
import { isCorrect } from "./answer-matcher";

export async function processQuizResults(quizId: string) {
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  if (!quiz) return;

  const quizQuestions = await prisma.question.findMany({
    where: { quizId },
  });

  const allAttempts = await prisma.attempt.findMany({
    where: { quizId, isComplete: true },
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

  // Bonus points: first 3 completions with 50%+ score
  const sortedAttempts = await prisma.attempt.findMany({
    where: { quizId, isComplete: true },
    orderBy: { completedAt: "asc" },
  });

  let bonusCount = 0;
  for (const attempt of sortedAttempts) {
    const score = attempt.rawScore ? Number(attempt.rawScore) : 0;
    if (score / quiz.questionCount >= 0.5 && bonusCount < 3) {
      await prisma.attempt.update({
        where: { id: attempt.id },
        data: { bonusPoints: 0.5 },
      });
      bonusCount++;
    } else {
      await prisma.attempt.update({
        where: { id: attempt.id },
        data: { bonusPoints: 0 },
      });
    }
  }

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
      const newScore = Math.max(0, Number(existing.totalScore) - 0.5);
      await prisma.overallScore.update({
        where: { userId: user.id },
        data: {
          totalScore: newScore,
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
      quiz: { resultsProcessed: true },
    },
  });

  let totalScore = 0;
  let quizzesAttempted = 0;

  for (const attempt of userAttempts) {
    totalScore += Number(attempt.rawScore ?? 0) + Number(attempt.bonusPoints ?? 0);
    quizzesAttempted++;
  }

  const existing = await prisma.overallScore.findUnique({
    where: { userId },
  });

  const missedCount = existing?.quizzesMissed ?? 0;
  totalScore -= missedCount * 0.5;
  totalScore = Math.max(0, totalScore);

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
