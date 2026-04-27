import { prisma } from "./db";
import { getUsersAggregates } from "./aggregate-score";

type OverallRank = {
  rank: number;
  tiedCount: number;
  totalMembers: number;
};

/**
 * Rank a user on the overall (cross-quiz) leaderboard.
 *
 * Pass the user's live-computed totalScore and whether they should be assigned
 * a rank (e.g. true once they have any participation). Returns `rank = 0` if
 * `hasScore` is false. Ties are shared-rank: everyone with the same score sees
 * the same `rank`, and `tiedCount` is the number of OTHER members at that
 * score.
 */
export async function getOverallRank(
  score: number,
  hasScore: boolean
): Promise<OverallRank> {
  const users = await prisma.user.findMany({
    where: { isApproved: true, role: "user" },
    select: { id: true },
  });
  const aggregates = await getUsersAggregates(users.map((u) => u.id));

  const higherScores = new Set<number>();
  let same = 0;
  for (const agg of aggregates.values()) {
    if (agg.totalScore > score) higherScores.add(agg.totalScore);
    else if (agg.totalScore === score) same++;
  }

  const rank = hasScore ? higherScores.size + 1 : 0;
  const tiedCount = hasScore ? Math.max(0, same - 1) : 0;
  return { rank, tiedCount, totalMembers: users.length };
}

type QuizRank = {
  rank: number;
  tiedCount: number;
  totalAttempts: number;
};

/**
 * Rank an attempt within a single quiz. Only counts non-archived, completed
 * attempts. Shared-rank ties.
 */
export async function getQuizRank(
  quizId: string,
  score: number,
  hasAttempt: boolean
): Promise<QuizRank> {
  const [higherDistinct, same, totalAttempts] = await Promise.all([
    prisma.attempt.groupBy({
      by: ["rawScore"],
      where: {
        quizId,
        isComplete: true,
        archivedAt: null,
        rawScore: { gt: score },
      },
    }),
    prisma.attempt.count({
      where: {
        quizId,
        isComplete: true,
        archivedAt: null,
        rawScore: score,
      },
    }),
    prisma.attempt.count({
      where: { quizId, isComplete: true, archivedAt: null },
    }),
  ]);

  const rank = hasAttempt ? higherDistinct.length + 1 : 0;
  const tiedCount = hasAttempt ? Math.max(0, same - 1) : 0;
  return { rank, tiedCount, totalAttempts };
}
