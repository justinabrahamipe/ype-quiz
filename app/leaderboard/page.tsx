import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Header } from "@/components/header";
import { BottomNav } from "@/components/bottom-nav";
import { MembersContent } from "@/components/members-content";
import { getUsersAggregates } from "@/lib/aggregate-score";

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
    select: { id: true, name: true, email: true, image: true },
  });
  const aggregates = await getUsersAggregates(qualifiedUsers.map((u) => u.id));

  const sorted = qualifiedUsers
    .map((u) => {
      const agg = aggregates.get(u.id) ?? {
        totalScore: 0,
        quizzesAttempted: 0,
        quizzesMissed: 0,
      };
      return {
        id: u.id,
        name: u.name || "Anonymous",
        email: u.email,
        image: u.image,
        score: agg.totalScore,
        quizzesAttempted: agg.quizzesAttempted,
        quizzesMissed: agg.quizzesMissed,
      };
    })
    .sort((a, b) => b.score - a.score);

  // Competition ranking: tied scores share a rank, the next rank skips
  // accordingly (1, 2, 2, 4 …).
  let lastScore: number | null = null;
  let lastRank = 0;
  const members = sorted.map((m, i) => {
    const rank = m.score === lastScore ? lastRank : i + 1;
    lastScore = m.score;
    lastRank = rank;
    return { ...m, rank };
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <MembersContent members={members} currentUserId={userId} />
      <BottomNav />
    </div>
  );
}
