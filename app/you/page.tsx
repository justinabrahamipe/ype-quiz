import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { BottomNav } from "@/components/bottom-nav";
import { YouContent } from "@/components/you-content";
import { backfillAttemptScores } from "@/lib/scoring";
import { getOverallRank } from "@/lib/rank";
import { getUserAggregate } from "@/lib/aggregate-score";

export default async function YouPage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id;
  const { s: seasonParam } = await searchParams;

  // Backfill any legacy unscored attempts before reading stats
  await backfillAttemptScores(userId);

  // Fetch settings + available seasons in parallel with user data
  const [dbUser, appSettings, seasonRows, seasonLabelRows] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, image: true, isQualified: true, createdAt: true },
    }),
    prisma.appSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } }),
    prisma.quiz.findMany({
      where: { isDraft: false, isPrerequisite: false },
      select: { season: true },
      distinct: ["season"],
      orderBy: { season: "asc" },
    }),
    prisma.seasonLabel.findMany(),
  ]);
  const seasonLabels: Record<number, string> = Object.fromEntries(
    seasonLabelRows.map((l) => [l.season, l.name])
  );

  const currentSeason = appSettings.currentSeason;
  const seasons = seasonRows.map((r) => r.season);
  // Always include currentSeason even if it has no quizzes yet
  if (!seasons.includes(currentSeason)) {
    seasons.push(currentSeason);
    seasons.sort((a, b) => a - b);
  }

  // "all" means all seasons combined; otherwise parse number or default to current
  const effectiveSeason: number | undefined =
    seasonParam === "all"
      ? undefined
      : seasonParam
      ? (Number.isNaN(parseInt(seasonParam, 10)) ? currentSeason : parseInt(seasonParam, 10))
      : currentSeason;

  const now = new Date();

  // Attempts scoped to the selected season. Prereq is included for season 1
  // but excluded for season 2+ (its score doesn't count there).
  const attempts = await prisma.attempt.findMany({
    where: {
      userId,
      isComplete: true,
      archivedAt: null,
      ...(seasons.length > 1 && effectiveSeason !== undefined
        ? {
            quiz:
              effectiveSeason <= 1
                ? { OR: [{ isPrerequisite: true }, { isPrerequisite: false, season: effectiveSeason }] }
                : { isPrerequisite: false, season: effectiveSeason },
          }
        : {}),
    },
    include: {
      quiz: { select: { title: true, isPrerequisite: true, endTime: true } },
    },
    orderBy: { completedAt: "desc" },
  });

  const [aggregate, rankResult] = await Promise.all([
    getUserAggregate(userId, effectiveSeason),
    // placeholder — rank computed after aggregate
    Promise.resolve(null),
  ]);

  const onBoard =
    aggregate.totalScore > 0 ||
    aggregate.quizzesAttempted > 0 ||
    aggregate.quizzesMissed > 0;

  const { rank, tiedCount, totalMembers } = await getOverallRank(
    aggregate.totalScore,
    onBoard,
    effectiveSeason
  );

  void rankResult;

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
        totalScore={aggregate.totalScore}
        quizzesAttempted={aggregate.quizzesAttempted}
        quizzesMissed={aggregate.quizzesMissed}
        rank={rank}
        tiedCount={tiedCount}
        totalMembers={totalMembers}
        seasons={seasons}
        selectedSeason={effectiveSeason}
        currentSeason={currentSeason}
        seasonLabels={seasonLabels}
        recentAttempts={attempts.slice(0, 10).map((a) => {
          const quizEnded = a.quiz.endTime < now;
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
