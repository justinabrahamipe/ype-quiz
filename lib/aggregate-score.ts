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
 * Whether the prerequisite (qualifying) quiz score counts toward a season's
 * total. It counts for Season 1 (or when no season filter is applied) but not
 * for Season 2 and above — by design, fresh seasons start without the
 * qualifier bonus.
 */
function prereqCountsForSeason(season?: number): boolean {
  return season === undefined || season <= 1;
}

/**
 * Live-compute a user's leaderboard aggregates from the raw response/attempt
 * tables. Replaces the previously-cached OverallScore row.
 *
 * Pass an optional `season` number to scope scores to a specific season.
 * When omitted all seasons are included (backward-compatible).
 * From Season 2 onwards the prerequisite quiz score is excluded.
 */
export async function getUserAggregate(
  userId: string,
  season?: number
): Promise<UserAggregate> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true },
  });
  if (!user) return ZERO;

  const now = new Date();
  const seasonFilter = season !== undefined ? { season } : {};
  const includePrereq = prereqCountsForSeason(season);

  const [scoreSum, attempted, eligiblePast, attemptedEligiblePast] =
    await Promise.all([
      prisma.attempt.aggregate({
        where: {
          userId,
          isComplete: true,
          archivedAt: null,
          OR: [
            ...(includePrereq ? [{ quiz: { isPrerequisite: true } }] : []),
            { quiz: { isPrerequisite: false, endTime: { lt: now }, ...seasonFilter } },
            { quiz: { isPrerequisite: false, resultsProcessed: true, ...seasonFilter } },
          ],
        },
        _sum: { rawScore: true },
      }),
      prisma.attempt.count({
        where: {
          userId,
          isComplete: true,
          archivedAt: null,
          ...(season !== undefined
            ? {
                quiz: includePrereq
                  ? { OR: [{ isPrerequisite: true }, { isPrerequisite: false, season }] }
                  : { isPrerequisite: false, season },
              }
            : {}),
        },
      }),
      prisma.quiz.count({
        where: {
          isPrerequisite: false,
          isDraft: false,
          endTime: { lt: now },
          startTime: { gt: user.createdAt },
          ...seasonFilter,
        },
      }),
      prisma.attempt.count({
        where: {
          userId,
          quiz: {
            isPrerequisite: false,
            isDraft: false,
            endTime: { lt: now },
            startTime: { gt: user.createdAt },
            ...seasonFilter,
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
 *
 * Pass an optional `season` number to scope scores to a specific season.
 * When omitted all seasons are included. From Season 2 onwards the
 * prerequisite quiz score is excluded.
 */
export async function getUsersAggregates(
  userIds: string[],
  season?: number
): Promise<Map<string, UserAggregate>> {
  const result = new Map<string, UserAggregate>();
  if (userIds.length === 0) return result;

  const now = new Date();
  const seasonFilter = season !== undefined ? { season } : {};
  const includePrereq = prereqCountsForSeason(season);

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
        quiz: { select: { isPrerequisite: true, endTime: true, resultsProcessed: true, season: true } },
      },
    }),
    prisma.quiz.findMany({
      where: { isPrerequisite: false, isDraft: false, endTime: { lt: now }, ...seasonFilter },
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
        if (a.quiz.isPrerequisite) {
          if (includePrereq) {
            quizzesAttempted++;
            totalScore += Number(a.rawScore ?? 0);
          }
        } else {
          const inSeason = season === undefined || a.quiz.season === season;
          if (inSeason) {
            quizzesAttempted++;
            const scoreVisible = a.quiz.endTime < now || a.quiz.resultsProcessed;
            if (scoreVisible) totalScore += Number(a.rawScore ?? 0);
          }
        }
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
