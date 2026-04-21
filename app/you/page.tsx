import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { BottomNav } from "@/components/bottom-nav";
import { YouContent } from "@/components/you-content";
import { backfillAttemptScores } from "@/lib/scoring";
import { getOverallRank } from "@/lib/rank";
import { getUserAggregate } from "@/lib/aggregate-score";

export default async function YouPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id;

  // Backfill any legacy unscored attempts before reading stats
  await backfillAttemptScores(userId);

  const [dbUser, attempts, aggregate] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, image: true, isQualified: true, createdAt: true },
    }),
    prisma.attempt.findMany({
      where: { userId, isComplete: true, archivedAt: null },
      include: {
        quiz: { select: { title: true, isPrerequisite: true, endTime: true, resultsProcessed: true } },
      },
      orderBy: { completedAt: "desc" },
    }),
    getUserAggregate(userId),
  ]);

  const now2 = new Date();
  // For YouContent we only show points from finalised quizzes (closed regular
  // quizzes + the prereq), so an in-progress quiz's score isn't revealed early.
  const totalPoints = attempts
    .filter((a) => a.quiz.isPrerequisite || a.quiz.endTime < now2)
    .reduce((sum, a) => sum + Number(a.rawScore ?? 0), 0);

  const onBoard =
    aggregate.totalScore > 0 ||
    aggregate.quizzesAttempted > 0 ||
    aggregate.quizzesMissed > 0;
  const { rank, tiedCount, totalMembers } = await getOverallRank(
    aggregate.totalScore,
    onBoard
  );

  const quizzesAttempted = aggregate.quizzesAttempted;
  const quizzesMissed = aggregate.quizzesMissed;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <YouContent
        userId={userId}
        name={dbUser?.name || session.user.name || ""}
        email={dbUser?.email || ""}
        image={dbUser?.image || session.user.image || null}
        isQualified={dbUser?.isQualified ?? false}
        joinedAt={dbUser?.createdAt?.toISOString() || ""}
        totalScore={totalPoints}
        quizzesAttempted={quizzesAttempted}
        quizzesMissed={quizzesMissed}
        rank={rank}
        tiedCount={tiedCount}
        totalMembers={totalMembers}
        recentAttempts={attempts.slice(0, 10).map((a) => {
          const quizEnded = a.quiz.endTime < now2;
          return {
            id: a.id,
            quizId: a.quizId,
            quizTitle: a.quiz.title,
            isPrerequisite: a.quiz.isPrerequisite,
            score: quizEnded || a.quiz.isPrerequisite ? Number(a.rawScore ?? 0) : null,
            completedAt: a.completedAt?.toISOString() || "",
          };
        })}
      />
      <BottomNav />
    </div>
  );
}
