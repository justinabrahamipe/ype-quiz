import { prisma } from "./db";

export type UserAggregate = {
  totalScore: number;
  quizzesAttempted: number;
  quizzesMissed: number;
};

const ZERO: UserAggregate = {
  totalScore: 0,
  quizzesAttempted: 0,
  quizzesMissed: 0,
};

/**
 * Live-compute a user's leaderboard aggregates from the raw response/attempt
 * tables. Replaces the previously-cached OverallScore row.
 *
 * Definitions (chosen to match the legacy updateOverallScore + processPenalties
 * semantics so display values don't shift):
 *   - totalScore: SUM(attempt.rawScore) over non-archived completed attempts.
 *   - quizzesAttempted: count of non-archived completed non-prerequisite
 *     attempts.
 *   - quizzesMissed: count of non-prerequisite quizzes that ended before now
 *     AND started after the user joined, for which the user has no attempt at
 *     all (matches the old penalty processor's eligibility check).
 */
export async function getUserAggregate(
  userId: string
): Promise<UserAggregate> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true },
  });
  if (!user) return ZERO;

  const now = new Date();

  const [scoreSum, attempted, eligiblePast, attemptedEligiblePast] =
    await Promise.all([
      prisma.attempt.aggregate({
        where: { userId, isComplete: true, archivedAt: null },
        _sum: { rawScore: true },
      }),
      prisma.attempt.count({
        where: {
          userId,
          isComplete: true,
          archivedAt: null,
          quiz: { isPrerequisite: false },
        },
      }),
      prisma.quiz.count({
        where: {
          isPrerequisite: false,
          endTime: { lt: now },
          startTime: { gt: user.createdAt },
        },
      }),
      prisma.attempt.count({
        where: {
          userId,
          quiz: {
            isPrerequisite: false,
            endTime: { lt: now },
            startTime: { gt: user.createdAt },
          },
        },
      }),
    ]);

  return {
    totalScore: Number(scoreSum._sum.rawScore ?? 0),
    quizzesAttempted: attempted,
    quizzesMissed: Math.max(0, eligiblePast - attemptedEligiblePast),
  };
}

/**
 * Batched version for the leaderboard. Returns a map keyed by userId.
 * Issues 3 fixed queries regardless of the user count.
 */
export async function getUsersAggregates(
  userIds: string[]
): Promise<Map<string, UserAggregate>> {
  const result = new Map<string, UserAggregate>();
  if (userIds.length === 0) return result;

  const now = new Date();
  const [users, allAttempts, pastQuizzes] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, createdAt: true },
    }),
    prisma.attempt.findMany({
      where: { userId: { in: userIds } },
      select: {
        userId: true,
        quizId: true,
        rawScore: true,
        isComplete: true,
        archivedAt: true,
        quiz: { select: { isPrerequisite: true } },
      },
    }),
    prisma.quiz.findMany({
      where: { isPrerequisite: false, endTime: { lt: now } },
      select: { id: true, startTime: true },
    }),
  ]);

  for (const user of users) {
    let totalScore = 0;
    let quizzesAttempted = 0;
    const attemptedQuizIds = new Set<string>();

    for (const a of allAttempts) {
      if (a.userId !== user.id) continue;
      attemptedQuizIds.add(a.quizId);
      if (a.isComplete && !a.archivedAt) {
        totalScore += Number(a.rawScore ?? 0);
        if (!a.quiz.isPrerequisite) quizzesAttempted++;
      }
    }

    let quizzesMissed = 0;
    for (const q of pastQuizzes) {
      if (q.startTime > user.createdAt && !attemptedQuizIds.has(q.id)) {
        quizzesMissed++;
      }
    }

    result.set(user.id, { totalScore, quizzesAttempted, quizzesMissed });
  }

  return result;
}
