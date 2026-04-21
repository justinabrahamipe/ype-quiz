import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getUsersAggregates } from "@/lib/aggregate-score";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "overall";
  const quizId = searchParams.get("quiz_id");

  if (type === "quiz" && quizId) {
    // Per-quiz leaderboard (only for closed quizzes)
    const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz || !quiz.resultsProcessed) {
      return NextResponse.json({ error: "Results not available" }, { status: 400 });
    }

    const attempts = await prisma.attempt.findMany({
      where: {
        quizId,
        isComplete: true,
        archivedAt: null,
        user: { isApproved: true, role: "user" },
      },
      include: { user: { select: { id: true, name: true, image: true } } },
      orderBy: { rawScore: "desc" },
    });

    const leaderboard = attempts.map((a, i) => ({
      rank: i + 1,
      user_id: a.user.id,
      name: a.user.name,
      image: a.user.image,
      score: Number(a.rawScore ?? 0),
    }));

    return NextResponse.json(leaderboard);
  }

  // Overall leaderboard
  const users = await prisma.user.findMany({
    where: { isApproved: true, role: "user" },
    select: { id: true, name: true, image: true },
  });
  const aggregates = await getUsersAggregates(users.map((u) => u.id));
  const sorted = users
    .map((u) => ({
      user_id: u.id,
      name: u.name,
      image: u.image,
      score: aggregates.get(u.id)?.totalScore ?? 0,
    }))
    .sort((a, b) => b.score - a.score);

  // Competition ranking: tied scores share a rank.
  let lastScore: number | null = null;
  let lastRank = 0;
  const leaderboard = sorted.map((row, i) => {
    const rank = row.score === lastScore ? lastRank : i + 1;
    lastScore = row.score;
    lastRank = rank;
    return { rank, ...row };
  });

  return NextResponse.json(leaderboard);
}
