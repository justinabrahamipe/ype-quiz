import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { BottomNav } from "@/components/bottom-nav";
import { QuizzesDashboard } from "@/components/quizzes-dashboard";
import { backfillAttemptScores, updateOverallScore } from "@/lib/scoring";
import { getOverallRank } from "@/lib/rank";

export default async function QuizzesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id;
  const now = new Date();

  await backfillAttemptScores(userId);
  await updateOverallScore(userId);

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { isQualified: true, isApproved: true, name: true },
  });

  const isQualified = dbUser?.isQualified ?? false;
  const isApproved = dbUser?.isApproved ?? false;

  const [quizzes, leaderboard, userAttempts] = await Promise.all([
    prisma.quiz.findMany({
      orderBy: { startTime: "desc" },
      take: 20,
      include: { _count: { select: { attempts: true } } },
    }),
    prisma.overallScore.findMany({
      where: { user: { isApproved: true, role: "user" } },
      orderBy: { totalScore: "desc" },
      take: 10,
    }),
    prisma.attempt.findMany({
      where: { userId, archivedAt: null },
      select: {
        quizId: true,
        isComplete: true,
        rawScore: true,
        quiz: { select: { isPrerequisite: true } },
      },
    }),
  ]);

  const attemptMap = Object.fromEntries(
    userAttempts.map((a) => [a.quizId, a.isComplete])
  );
  const scoreMap = Object.fromEntries(
    userAttempts.map((a) => [
      a.quizId,
      a.isComplete ? Number(a.rawScore ?? 0) : null,
    ])
  );

  const prerequisiteQuiz = quizzes.find((q) => q.isPrerequisite);
  const regularQuizzes = quizzes.filter((q) => !q.isPrerequisite);

  const activeQuizzes = regularQuizzes.filter(
    (q) => now >= q.startTime && now <= q.endTime
  );
  const upcomingQuizzes = regularQuizzes.filter((q) => now < q.startTime);
  const pastQuizzes = regularQuizzes.filter((q) => now > q.endTime);

  const userTotalScore = userAttempts
    .filter((a) => a.isComplete && !a.quiz?.isPrerequisite)
    .reduce((sum, a) => sum + Number(a.rawScore ?? 0), 0);

  const leaderboardEntry = leaderboard.find((s) => s.userId === userId);
  const userScore = leaderboardEntry ? Number(leaderboardEntry.totalScore) : userTotalScore;

  const { rank: userRank, tiedCount: userTiedCount } =
    userScore > 0 || leaderboardEntry
      ? await getOverallRank(userScore, !!leaderboardEntry)
      : { rank: 0, tiedCount: 0 };

  const prereqAttempted = prerequisiteQuiz ? attemptMap[prerequisiteQuiz.id] : undefined;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <QuizzesDashboard
        isApproved={isApproved}
        isQualified={isQualified}
        userName={dbUser?.name || session.user.name || ""}
        userRank={userRank}
        userTiedCount={userTiedCount}
        userScore={userScore}
        prerequisiteQuiz={
          prerequisiteQuiz
            ? {
                id: prerequisiteQuiz.id,
                title: prerequisiteQuiz.title,
                biblePortion: prerequisiteQuiz.biblePortion,
                questionCount: prerequisiteQuiz.questionCount,
              }
            : null
        }
        prereqAttempted={prereqAttempted}
        activeQuizzes={activeQuizzes.map((q) => ({
          id: q.id,
          title: q.title,
          biblePortion: q.biblePortion,
          questionCount: q.questionCount,
          endTime: q.endTime.toISOString(),
          participants: q._count.attempts,
          attempted: attemptMap[q.id],
        }))}
        upcomingQuizzes={upcomingQuizzes.map((q) => ({
          id: q.id,
          title: q.title,
          biblePortion: q.biblePortion,
          questionCount: q.questionCount,
          startTime: q.startTime.toISOString(),
        }))}
        pastQuizzes={pastQuizzes.map((q) => ({
          id: q.id,
          title: q.title,
          biblePortion: q.biblePortion,
          questionCount: q.questionCount,
          endTime: q.endTime.toISOString(),
          participants: q._count.attempts,
          attempted: attemptMap[q.id],
          userScore: scoreMap[q.id] ?? null,
        }))}
      />
      <BottomNav />
    </div>
  );
}
