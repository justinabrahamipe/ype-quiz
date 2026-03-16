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

  const [dbUser, overallScore, attempts, totalMembers] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, image: true, isQualified: true, createdAt: true },
    }),
    prisma.overallScore.findUnique({ where: { userId } }),
    prisma.attempt.findMany({
      where: { userId, isComplete: true },
      include: {
        quiz: { select: { title: true, isPrerequisite: true } },
      },
      orderBy: { completedAt: "desc" },
    }),
    prisma.overallScore.count(),
  ]);

  // Calculate rank
  const rank = overallScore
    ? (await prisma.overallScore.count({
        where: { totalScore: { gt: overallScore.totalScore } },
      })) + 1
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <YouContent
        name={dbUser?.name || session.user.name || ""}
        email={dbUser?.email || ""}
        image={dbUser?.image || session.user.image || null}
        isQualified={dbUser?.isQualified ?? false}
        joinedAt={dbUser?.createdAt?.toISOString() || ""}
        totalScore={Number(overallScore?.totalScore ?? 0)}
        quizzesAttempted={overallScore?.quizzesAttempted ?? 0}
        quizzesMissed={overallScore?.quizzesMissed ?? 0}
        rank={rank}
        totalMembers={totalMembers}
        recentAttempts={attempts.slice(0, 10).map((a) => ({
          id: a.id,
          quizTitle: a.quiz.title,
          isPrerequisite: a.quiz.isPrerequisite,
          score: Number(a.rawScore ?? 0) + Number(a.bonusPoints ?? 0),
          completedAt: a.completedAt?.toISOString() || "",
        }))}
      />
      <BottomNav />
    </div>
  );
}
