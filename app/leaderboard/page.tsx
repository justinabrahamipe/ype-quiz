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
  searchParams: Promise<{ q?: string; s?: string }>;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  const { q: selectedQuizId, s: seasonParam } = await searchParams;
  const now = new Date();

  // Fetch current season from settings (defaults to 1)
  const appSettings = await prisma.appSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });
  const currentSeason = appSettings.currentSeason;

  // No param → current season. "all" → all seasons. ?s=N → specific season.
  const effectiveSeason: number | undefined =
    !seasonParam
      ? currentSeason
      : seasonParam === "all"
      ? undefined
      : Number.isNaN(parseInt(seasonParam, 10))
      ? currentSeason
      : parseInt(seasonParam, 10);

  // Season labels (custom names) + distinct season numbers
  const [seasonLabelRows, seasonRows] = await Promise.all([
    prisma.seasonLabel.findMany(),
    prisma.quiz.findMany({
      where: { isDraft: false, isPrerequisite: false },
      select: { season: true },
      distinct: ["season"],
      orderBy: { season: "asc" },
    }),
  ]);
  const seasonLabels: Record<number, string> = Object.fromEntries(
    seasonLabelRows.map((l) => [l.season, l.name])
  );
  const seasons = seasonRows.map((r) => r.season);
  // Always include currentSeason even if it has no quizzes yet
  if (!seasons.includes(currentSeason)) {
    seasons.push(currentSeason);
    seasons.sort((a, b) => a - b);
  }

  // Finished quizzes for the quiz dropdown (scoped to selected season, or all)
  const finishedQuizzes = await prisma.quiz.findMany({
    where: {
      isDraft: false,
      isPrerequisite: false,
      ...(effectiveSeason !== undefined ? { season: effectiveSeason } : {}),
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
    // Allow viewing any finished quiz regardless of season filter
    const quiz = await prisma.quiz.findFirst({
      where: {
        id: selectedQuizId,
        isDraft: false,
        isPrerequisite: false,
        OR: [{ endTime: { lt: now } }, { resultsProcessed: true }],
      },
      select: { id: true, title: true, questionCount: true, season: true },
    });
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

    // For per-quiz view, show the season's quiz options in the dropdown
    const quizSeasonOptions = await prisma.quiz.findMany({
      where: {
        isDraft: false,
        isPrerequisite: false,
        season: quiz.season,
        OR: [{ endTime: { lt: now } }, { resultsProcessed: true }],
      },
      select: { id: true, title: true },
      orderBy: { endTime: "asc" },
    });

    return (
      <div className="min-h-screen bg-background">
        <Header />
        <MembersContent
          members={[]}
          currentUserId={userId}
          quizOptions={quizSeasonOptions.map((q) => ({ id: q.id, label: q.title }))}
          selectedQuizId={selectedQuizId}
          quizTitle={quiz.title}
          totalQuestions={quiz.questionCount}
          quizMembers={quizMembers}
          seasons={seasons}
          selectedSeason={quiz.season}
          currentSeason={currentSeason}
          seasonLabels={seasonLabels}
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
  const aggregates = await getUsersAggregates(
    qualifiedUsers.map((u) => u.id),
    effectiveSeason
  );

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
        seasons={seasons}
        selectedSeason={effectiveSeason}
        currentSeason={currentSeason}
        seasonLabels={seasonLabels}
      />
      <BottomNav />
    </div>
  );
}
