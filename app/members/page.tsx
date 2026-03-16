import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Header } from "@/components/header";
import { BottomNav } from "@/components/bottom-nav";
import { MembersContent } from "@/components/members-content";

export default async function MembersPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const qualifiedUsers = await prisma.user.findMany({
    where: { isQualified: true },
    include: {
      overallScore: true,
      _count: { select: { attempts: { where: { isComplete: true } } } },
    },
    orderBy: { overallScore: { totalScore: "desc" } },
  });

  const members = qualifiedUsers.map((u) => ({
    id: u.id,
    name: u.name || "Anonymous",
    email: u.email,
    image: u.image,
    score: Number(u.overallScore?.totalScore ?? 0),
    quizzesAttempted: u._count.attempts,
    quizzesMissed: u.overallScore?.quizzesMissed ?? 0,
  }));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <MembersContent members={members} currentUserId={userId} />
      <BottomNav />
    </div>
  );
}
