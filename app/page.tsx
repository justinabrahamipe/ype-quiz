import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Header } from "@/components/header";
import Link from "next/link";
import { Countdown } from "@/components/countdown";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const now = new Date();

  const [quizzes, leaderboard, userAttempts] = await Promise.all([
    prisma.quiz.findMany({
      orderBy: { startTime: "desc" },
      take: 20,
      include: { _count: { select: { attempts: true } } },
    }),
    prisma.overallScore.findMany({
      include: { user: { select: { id: true, name: true, image: true } } },
      orderBy: { totalScore: "desc" },
      take: 10,
    }),
    prisma.attempt.findMany({
      where: { userId: session.user.id },
      select: { quizId: true, isComplete: true },
    }),
  ]);

  const attemptMap = new Map(
    userAttempts.map((a) => [a.quizId, a.isComplete])
  );

  const activeQuizzes = quizzes.filter(
    (q) => now >= q.startTime && now <= q.endTime
  );
  const upcomingQuizzes = quizzes.filter((q) => now < q.startTime);
  const pastQuizzes = quizzes.filter((q) => now > q.endTime);

  const userRank =
    leaderboard.findIndex((s) => s.userId === session.user.id) + 1;
  const userScore = leaderboard.find(
    (s) => s.userId === session.user.id
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* User Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Your Rank
            </p>
            <p className="text-2xl font-bold mt-1">
              {userRank > 0 ? `#${userRank}` : "—"}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Total Score
            </p>
            <p className="text-2xl font-bold mt-1">
              {userScore ? Number(userScore.totalScore) : 0}
            </p>
          </div>
        </div>

        {/* Active Quizzes */}
        {activeQuizzes.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Active Now
            </h2>
            {activeQuizzes.map((quiz) => {
              const attempted = attemptMap.get(quiz.id);
              return (
                <Link
                  key={quiz.id}
                  href={
                    attempted === true
                      ? `/quiz/${quiz.id}/results`
                      : `/quiz/${quiz.id}`
                  }
                  className="block p-4 rounded-xl bg-white dark:bg-slate-800 border border-green-200 dark:border-green-800 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{quiz.title}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {quiz.biblePortion}
                      </p>
                    </div>
                    <span className="shrink-0 px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                      {attempted === true ? (
                        "Completed"
                      ) : attempted === false ? (
                        "In Progress"
                      ) : (
                        "Start"
                      )}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <span>{quiz.questionCount} questions</span>
                    <span>{quiz._count.attempts} participants</span>
                    <span>
                      <Countdown endTime={quiz.endTime.toISOString()} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </section>
        )}

        {/* Upcoming Quizzes */}
        {upcomingQuizzes.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Upcoming</h2>
            {upcomingQuizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <p className="font-semibold">{quiz.title}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {quiz.biblePortion}
                </p>
                <div className="mt-2 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                  <span>{quiz.questionCount} questions</span>
                  <span>
                    Starts{" "}
                    {quiz.startTime.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Past Quizzes */}
        {pastQuizzes.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Past Quizzes</h2>
            {pastQuizzes.map((quiz) => {
              const attempted = attemptMap.get(quiz.id);
              return (
                <Link
                  key={quiz.id}
                  href={
                    quiz.resultsProcessed
                      ? `/quiz/${quiz.id}/results`
                      : `/quiz/${quiz.id}/submitted`
                  }
                  className="block p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{quiz.title}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {quiz.biblePortion}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium ${
                        attempted != null
                          ? "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                          : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                      }`}
                    >
                      {attempted != null ? "Attempted" : "Missed"}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <span>{quiz.questionCount} questions</span>
                    <span>{quiz._count.attempts} participants</span>
                    {quiz.resultsProcessed && (
                      <span className="text-blue-600 dark:text-blue-400">
                        Results available
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </section>
        )}

        {quizzes.length === 0 && (
          <div className="text-center py-16 text-slate-500 dark:text-slate-400">
            <p className="text-lg font-medium">No quizzes yet</p>
            <p className="text-sm mt-1">Check back soon!</p>
          </div>
        )}

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Leaderboard</h2>
            <div className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
              {leaderboard.map((entry, i) => (
                <div
                  key={entry.userId}
                  className={`flex items-center gap-3 px-4 py-3 ${
                    entry.userId === session.user.id
                      ? "bg-blue-50 dark:bg-blue-900/20"
                      : ""
                  }`}
                >
                  <span
                    className={`w-7 text-center text-sm font-bold ${
                      i === 0
                        ? "text-yellow-500"
                        : i === 1
                        ? "text-slate-400"
                        : i === 2
                        ? "text-amber-600"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {i + 1}
                  </span>
                  {entry.user.image ? (
                    <img
                      src={entry.user.image}
                      alt=""
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700" />
                  )}
                  <span className="flex-1 text-sm font-medium truncate">
                    {entry.user.name || "Anonymous"}
                  </span>
                  <span className="text-sm font-semibold">
                    {Number(entry.totalScore)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
