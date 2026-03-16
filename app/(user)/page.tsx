import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { ActiveQuizCard } from "./active-quiz-card";
import { Leaderboard } from "./leaderboard";
import { PastQuizzes } from "./past-quizzes";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const now = new Date();

  // Active quiz
  const activeQuiz = await prisma.quiz.findFirst({
    where: { startTime: { lte: now }, endTime: { gte: now } },
    include: { _count: { select: { attempts: { where: { isComplete: true } } } } },
  });

  let userAttempt = null;
  if (activeQuiz) {
    userAttempt = await prisma.attempt.findUnique({
      where: { quizId_userId: { quizId: activeQuiz.id, userId: session.user.id } },
    });
  }

  // Past quizzes (ended)
  const pastQuizzes = await prisma.quiz.findMany({
    where: { endTime: { lt: now } },
    orderBy: { endTime: "desc" },
    take: 20,
  });

  const pastAttempts = await prisma.attempt.findMany({
    where: {
      userId: session.user.id,
      quizId: { in: pastQuizzes.map((q) => q.id) },
    },
  });

  const attemptMap = new Map(pastAttempts.map((a) => [a.quizId, a]));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <ActiveQuizCard
          quiz={activeQuiz ? {
            id: activeQuiz.id,
            title: activeQuiz.title,
            biblePortion: activeQuiz.biblePortion,
            endTime: activeQuiz.endTime.toISOString(),
            attemptCount: activeQuiz._count.attempts,
          } : null}
          userCompleted={userAttempt?.isComplete ?? false}
        />

        <Leaderboard userId={session.user.id} />

        <PastQuizzes
          quizzes={pastQuizzes.map((q) => {
            const attempt = attemptMap.get(q.id);
            return {
              id: q.id,
              title: q.title,
              biblePortion: q.biblePortion,
              endTime: q.endTime.toISOString(),
              resultsProcessed: q.resultsProcessed,
              userScore: attempt && q.resultsProcessed
                ? Number(attempt.rawScore ?? 0) + Number(attempt.bonusPoints ?? 0)
                : null,
              attempted: !!attempt,
              questionCount: q.questionCount,
            };
          })}
        />
      </main>
    </div>
  );
}
