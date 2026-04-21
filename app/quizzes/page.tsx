import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { BottomNav } from "@/components/bottom-nav";
import { QuizzesDashboard } from "@/components/quizzes-dashboard";
import { backfillAttemptScores } from "@/lib/scoring";

export default async function QuizzesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id;
  const now = new Date();

  await backfillAttemptScores(userId);

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { isQualified: true, isApproved: true, name: true },
  });

  const isQualified = dbUser?.isQualified ?? false;
  const isApproved = dbUser?.isApproved ?? false;

  const [quizzes, userAttempts] = await Promise.all([
    prisma.quiz.findMany({
      orderBy: { startTime: "desc" },
      take: 20,
      include: { _count: { select: { attempts: true } } },
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

  const prereqIsActive =
    !!prerequisiteQuiz &&
    now >= prerequisiteQuiz.startTime &&
    now <= prerequisiteQuiz.endTime;
  const prereqIsPast = !!prerequisiteQuiz && now > prerequisiteQuiz.endTime;

  const attemptedCount = userAttempts.filter((a) => a.isComplete).length;

  const attemptedPastQuizzes = pastQuizzes.filter(
    (q) => attemptMap[q.id] === true
  );
  const skippedPastQuizzes = pastQuizzes.filter(
    (q) => attemptMap[q.id] !== true
  );

  // Qualifying quiz: always appear in Attempted if completed (regardless of
  // quiz timing); appear in Skipped only if its window has closed and the user
  // never completed it.
  if (prerequisiteQuiz) {
    if (attemptMap[prerequisiteQuiz.id] === true) {
      attemptedPastQuizzes.push(prerequisiteQuiz);
    } else if (prereqIsPast) {
      skippedPastQuizzes.push(prerequisiteQuiz);
    }
  }
  const skippedCount = skippedPastQuizzes.length;

  const currentCount = activeQuizzes.length + (prereqIsActive ? 1 : 0);

  const prereqAttempted = prerequisiteQuiz ? attemptMap[prerequisiteQuiz.id] : undefined;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <QuizzesDashboard
        isApproved={isApproved}
        isQualified={isQualified}
        userName={dbUser?.name || session.user.name || ""}
        quizzesAttempted={attemptedCount}
        quizzesSkipped={skippedCount}
        quizzesCurrent={currentCount}
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
        attemptedQuizzes={attemptedPastQuizzes.map((q) => ({
          id: q.id,
          title: q.title,
          biblePortion: q.biblePortion,
          questionCount: q.questionCount,
          endTime: q.endTime.toISOString(),
          participants: q._count.attempts,
          userScore: scoreMap[q.id] ?? null,
        }))}
        skippedQuizzes={skippedPastQuizzes.map((q) => ({
          id: q.id,
          title: q.title,
          biblePortion: q.biblePortion,
          questionCount: q.questionCount,
          endTime: q.endTime.toISOString(),
          participants: q._count.attempts,
        }))}
      />
      <BottomNav />
    </div>
  );
}
