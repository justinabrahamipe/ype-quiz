import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { BottomNav } from "@/components/bottom-nav";
import { YouContent } from "@/components/you-content";

export default async function YouPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id;

  const [dbUser, overallScore, attempts, totalMembers, totalQuizzes] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, image: true, isQualified: true, createdAt: true },
    }),
    prisma.overallScore.findUnique({ where: { userId } }),
    prisma.attempt.findMany({
      where: { userId, isComplete: true },
      include: {
        quiz: { select: { title: true, isPrerequisite: true, endTime: true, resultsProcessed: true } },
      },
      orderBy: { completedAt: "desc" },
    }),
    prisma.overallScore.count(),
    prisma.quiz.count({ where: { isPrerequisite: false } }),
  ]);

  // Calculate stats from actual attempts
  const now2 = new Date();
  const quizzesAttempted = attempts.filter((a) => !a.quiz.isPrerequisite).length;
  const totalPoints = attempts
    .filter((a) => a.quiz.isPrerequisite || a.quiz.endTime < now2)
    .reduce(
      (sum, a) => sum + Number(a.rawScore ?? 0) + Number(a.bonusPoints ?? 0),
      0
    );

  // Calculate rank from overallScore or fallback
  let rank = 0;
  if (overallScore) {
    rank = (await prisma.overallScore.count({
      where: { totalScore: { gt: overallScore.totalScore } },
    })) + 1;
  } else if (totalPoints > 0) {
    rank = (await prisma.overallScore.count({
      where: { totalScore: { gt: totalPoints } },
    })) + 1;
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
        name={dbUser?.name || session.user.name || ""}
        email={dbUser?.email || ""}
        image={dbUser?.image || session.user.image || null}
        isQualified={dbUser?.isQualified ?? false}
        joinedAt={dbUser?.createdAt?.toISOString() || ""}
        totalScore={totalPoints}
        quizzesAttempted={quizzesAttempted}
        quizzesMissed={quizzesMissed}
        rank={rank}
        totalMembers={totalMembers}
        recentAttempts={attempts.slice(0, 10).map((a) => {
          const quizEnded = a.quiz.endTime < now2;
          return {
            id: a.id,
            quizId: a.quizId,
            quizTitle: a.quiz.title,
            isPrerequisite: a.quiz.isPrerequisite,
            score: quizEnded || a.quiz.isPrerequisite ? Number(a.rawScore ?? 0) + Number(a.bonusPoints ?? 0) : null,
            completedAt: a.completedAt?.toISOString() || "",
          };
        })}
      />
      <BottomNav />
    </div>
  );
}
