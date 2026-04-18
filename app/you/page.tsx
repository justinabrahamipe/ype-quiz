import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { BottomNav } from "@/components/bottom-nav";
import { YouContent } from "@/components/you-content";
import { backfillAttemptScores, updateOverallScore } from "@/lib/scoring";

export default async function YouPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id;

  // Backfill any legacy unscored attempts before reading stats
  await backfillAttemptScores(userId);
  await updateOverallScore(userId);

  const [dbUser, overallScore, attempts, totalMembers, totalQuizzes] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, image: true, isQualified: true, createdAt: true },
    }),
    prisma.overallScore.findUnique({ where: { userId } }),
    prisma.attempt.findMany({
      where: { userId, isComplete: true, archivedAt: null },
      include: {
        quiz: { select: { title: true, isPrerequisite: true, endTime: true, resultsProcessed: true } },
      },
      orderBy: { completedAt: "desc" },
    }),
    prisma.overallScore.count({
      where: { user: { isApproved: true, role: "user" } },
    }),
    prisma.quiz.count({ where: { isPrerequisite: false } }),
  ]);

  // Calculate stats from actual attempts
  const now2 = new Date();
  const quizzesAttempted = attempts.filter((a) => !a.quiz.isPrerequisite).length;
  const totalPoints = attempts
    .filter((a) => a.quiz.isPrerequisite || a.quiz.endTime < now2)
    .reduce(
      (sum, a) => sum + Number(a.rawScore ?? 0),
      0
    );

  // Calculate rank from overallScore or fallback
  let rank = 0;
  let tiedCount = 0;
  const compareScore = overallScore?.totalScore ?? (totalPoints > 0 ? totalPoints : null);
  if (compareScore !== null) {
    const [higher, same] = await Promise.all([
      prisma.overallScore.count({
        where: { totalScore: { gt: compareScore }, user: { isApproved: true, role: "user" } },
      }),
      prisma.overallScore.count({
        where: { totalScore: compareScore, user: { isApproved: true, role: "user" } },
      }),
    ]);
    rank = higher + 1;
    // Subtract 1 for the user themselves if they are already in the overallScore table
    tiedCount = Math.max(0, same - (overallScore ? 1 : 0));
  }

  // Quizzes missed: total non-prereq quizzes that ended before now minus attempted
  const endedQuizzes = await prisma.quiz.count({
    where: { isPrerequisite: false, endTime: { lt: new Date() } },
  });
  const quizzesMissed = Math.max(0, endedQuizzes - quizzesAttempted);

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
