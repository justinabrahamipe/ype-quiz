import { prisma } from "./db";

type OverallRank = {
  rank: number;
  tiedCount: number;
  totalMembers: number;
};

/**
 * Rank a user on the overall (cross-quiz) leaderboard.
 *
 * Returns `rank = 0` if the user has no OverallScore row yet. Ties are resolved
 * shared-rank style: everyone with the same score sees the same `rank`, and
 * `tiedCount` tells them how many other members share it.
 */
export async function getOverallRank(
  score: number,
  hasScoreRow: boolean
): Promise<OverallRank> {
  const [higher, same, totalMembers] = await Promise.all([
    prisma.overallScore.count({
      where: {
        totalScore: { gt: score },
        user: { isApproved: true, role: "user" },
      },
    }),
    prisma.overallScore.count({
      where: {
        totalScore: score,
        user: { isApproved: true, role: "user" },
      },
    }),
    prisma.overallScore.count({
      where: { user: { isApproved: true, role: "user" } },
    }),
  ]);

  const rank = hasScoreRow ? higher + 1 : 0;
  const tiedCount = hasScoreRow ? Math.max(0, same - 1) : 0;
  return { rank, tiedCount, totalMembers };
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
  const [higher, same, totalAttempts] = await Promise.all([
    prisma.attempt.count({
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

  const rank = hasAttempt ? higher + 1 : 0;
  const tiedCount = hasAttempt ? Math.max(0, same - 1) : 0;
  return { rank, tiedCount, totalAttempts };
}
