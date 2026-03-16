import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Header } from "@/components/header";
import { BottomNav } from "@/components/bottom-nav";
import { EditName } from "@/components/edit-name";
import { HomeContent } from "@/components/home-content";

export default async function Home() {
  const session = await auth();
  const isLoggedIn = !!session?.user;
  const userId = session?.user?.id;

  const now = new Date();

  const dbUser = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { isQualified: true, name: true },
      })
    : null;

  const isQualified = dbUser?.isQualified ?? false;

  const [quizzes, leaderboard, userAttempts] = await Promise.all([
    prisma.quiz.findMany({
      orderBy: { startTime: "desc" },
      take: 20,
      include: { _count: { select: { attempts: true } } },
    }),
    prisma.overallScore.findMany({
      include: { user: { select: { id: true, name: true, image: true, email: true } } },
      orderBy: { totalScore: "desc" },
      take: 10,
    }),
    userId
      ? prisma.attempt.findMany({
          where: { userId },
          select: { quizId: true, isComplete: true, rawScore: true, bonusPoints: true, quiz: { select: { isPrerequisite: true } } },
        })
      : [],
  ]);

  const attemptMap = Object.fromEntries(
    userAttempts.map((a) => [a.quizId, a.isComplete])
  );

  const prerequisiteQuiz = quizzes.find((q) => q.isPrerequisite);
  const regularQuizzes = quizzes.filter((q) => !q.isPrerequisite);

  const activeQuizzes = regularQuizzes.filter(
    (q) => now >= q.startTime && now <= q.endTime
  );
  const upcomingQuizzes = regularQuizzes.filter((q) => now < q.startTime);
  const pastQuizzes = regularQuizzes.filter((q) => now > q.endTime);

  // Calculate user score from attempts (not just overallScore table)
  const userTotalScore = userId
    ? userAttempts
        .filter((a) => a.isComplete && !a.quiz?.isPrerequisite)
        .reduce((sum, a) => sum + Number(a.rawScore ?? 0) + Number(a.bonusPoints ?? 0), 0)
    : 0;

  const leaderboardEntry = userId ? leaderboard.find((s) => s.userId === userId) : null;
  const userScore = leaderboardEntry ? Number(leaderboardEntry.totalScore) : userTotalScore;

  const userRank = userId
    ? leaderboardEntry
      ? leaderboard.findIndex((s) => s.userId === userId) + 1
      : 0
    : 0;

  const prereqAttempted = prerequisiteQuiz
    ? attemptMap[prerequisiteQuiz.id]
    : undefined;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HomeContent
        isLoggedIn={isLoggedIn}
        isQualified={isQualified}
        userId={userId}
        userName={dbUser?.name || session?.user?.name || ""}
        userRank={userRank}
        userScore={userScore}
        prerequisiteQuiz={prerequisiteQuiz ? {
          id: prerequisiteQuiz.id,
          title: prerequisiteQuiz.title,
          biblePortion: prerequisiteQuiz.biblePortion,
          questionCount: prerequisiteQuiz.questionCount,
        } : null}
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
          participants: q._count.attempts,
          resultsProcessed: q.resultsProcessed,
          attempted: attemptMap[q.id],
        }))}
        leaderboard={leaderboard.map((entry) => ({
          userId: entry.userId,
          name: entry.user.name || "Anonymous",
          email: entry.user.email,
          image: entry.user.image,
          score: Number(entry.totalScore),
        }))}
      />
      <BottomNav />
    </div>
  );
}
