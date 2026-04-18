import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Header } from "@/components/header";
import { BottomNav } from "@/components/bottom-nav";
import { MembersContent } from "@/components/members-content";

export const metadata: Metadata = (() => {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.mahanaimypequiz.com";
  const title = "Leaderboard · YPE Bible Quiz";
  const description =
    "Top scorers on the YPE Bible Quiz — Young People's Endeavour, Mahanaim Church of God, Manchester.";
  const pageUrl = `${siteUrl}/leaderboard`;
  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      type: "website",
      url: pageUrl,
      siteName: "YPE Bible Quiz",
      title,
      description,
    },
    twitter: { card: "summary_large_image", title, description },
    robots: { index: true, follow: true },
  };
})();

export default async function MembersPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const qualifiedUsers = await prisma.user.findMany({
    where: { isQualified: true, isApproved: true, role: "user" },
    include: {
      overallScore: true,
      _count: {
        select: {
          attempts: {
            where: {
              isComplete: true,
              archivedAt: null,
              quiz: { isPrerequisite: false },
            },
          },
        },
      },
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
