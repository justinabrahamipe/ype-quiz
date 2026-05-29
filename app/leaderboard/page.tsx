import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { BottomNav } from "@/components/bottom-nav";
import { MembersContent } from "@/components/members-content";
import { getUsersAggregates } from "@/lib/aggregate-score";

export const dynamic = "force-dynamic";

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

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  const { q: selectedQuizId } = await searchParams;
  const now = new Date();

  // All finished quizzes for the selector dropdown (oldest first)
  const finishedQuizzes = await prisma.quiz.findMany({
    where: {
      isDraft: false,
      isPrerequisite: false,
      OR: [
        { endTime: { lt: now } },
        { resultsProcessed: true },
      ],
    },
    select: { id: true, title: true, endTime: true, questionCount: true },
    orderBy: { endTime: "asc" },
  });

  const quizOptions = finishedQuizzes.map((q) => ({
    id: q.id,
    label: q.title,
  }));

  // ── Per-quiz view ─────────────────────────────────────────────────────────
  if (selectedQuizId) {
    const quiz = finishedQuizzes.find((q) => q.id === selectedQuizId);
    if (!quiz) redirect("/leaderboard");

    const attempts = await prisma.attempt.findMany({
      where: {
        quizId: selectedQuizId,
        isComplete: true,
        archivedAt: null,
        user: { isApproved: true, role: "user" },
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
      orderBy: { rawScore: "desc" },
    });

    const sorted = attempts.map((a) => ({
      userId: a.user.id,
      name: a.user.name || "Anonymous",
      image: a.user.image,
      score: Number(a.rawScore ?? 0),
    }));

    let lastScore: number | null = null;
    let lastRank = 0;
    const quizMembers = sorted.map((m, i) => {
      const rank = m.score === lastScore ? lastRank : i + 1;
      lastScore = m.score;
      lastRank = rank;
      return { ...m, rank };
    });

    return (
      <div className="min-h-screen bg-background">
        <Header />
        <MembersContent
          members={[]}
          currentUserId={userId}
          quizOptions={quizOptions}
          selectedQuizId={selectedQuizId}
          quizTitle={quiz.title}
          totalQuestions={quiz.questionCount}
          quizMembers={quizMembers}
        />
        <BottomNav />
      </div>
    );
  }

  // ── Overall view ──────────────────────────────────────────────────────────
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

  let lastScore: number | null = null;
  let lastRank = 0;
  const members = sorted.map((m) => {
    const rank = m.score === lastScore ? lastRank : lastRank + 1;
    lastScore = m.score;
    lastRank = rank;
    return { ...m, rank };
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <MembersContent
        members={members}
        currentUserId={userId}
        quizOptions={quizOptions}
        selectedQuizId={undefined}
      />
      <BottomNav />
    </div>
  );
}
