import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Header } from "@/components/header";
import Link from "next/link";
import { Countdown } from "@/components/countdown";

export default async function Home() {
  const session = await auth();
  const userId = session?.user?.id;

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
    userId
      ? prisma.attempt.findMany({
          where: { userId },
          select: { quizId: true, isComplete: true },
        })
      : [],
  ]);

  const attemptMap = new Map(
    userAttempts.map((a) => [a.quizId, a.isComplete])
  );

  const activeQuizzes = quizzes.filter(
    (q) => now >= q.startTime && now <= q.endTime
  );
  const upcomingQuizzes = quizzes.filter((q) => now < q.startTime);
  const pastQuizzes = quizzes.filter((q) => now > q.endTime);

  const userRank = userId
    ? leaderboard.findIndex((s) => s.userId === userId) + 1
    : 0;
  const userScore = userId
    ? leaderboard.find((s) => s.userId === userId)
    : null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Welcome banner for guests */}
        {!userId && (
          <div className="card gradient-card p-6 text-center space-y-3 animate-fade-in">
            <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold">Welcome to BibleQuiz</h2>
              <p className="text-sm text-[var(--muted)] mt-1">
                Test your Bible knowledge and compete with your church
              </p>
            </div>
            <Link
              href="/login"
              className="btn-primary inline-block"
            >
              Sign in to participate
            </Link>
          </div>
        )}

        {/* User Stats (logged in only) */}
        {userId && (
          <div className="grid grid-cols-2 gap-4 animate-fade-in">
            <div className="card p-5 gradient-card">
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                Your Rank
              </p>
              <p className="text-3xl font-bold mt-2 gradient-text">
                {userRank > 0 ? `#${userRank}` : "—"}
              </p>
            </div>
            <div className="card p-5 gradient-card">
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                Total Score
              </p>
              <p className="text-3xl font-bold mt-2 gradient-text">
                {userScore ? Number(userScore.totalScore) : 0}
              </p>
            </div>
          </div>
        )}

        {/* Active Quizzes */}
        {activeQuizzes.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Active Now
            </h2>
            {activeQuizzes.map((quiz, i) => {
              const attempted = attemptMap.get(quiz.id);
              const href = userId
                ? attempted === true
                  ? `/quiz/${quiz.id}/results`
                  : `/quiz/${quiz.id}`
                : "/login";
              return (
                <Link
                  key={quiz.id}
                  href={href}
                  className="block card p-5 active-glow border-emerald-200 dark:border-emerald-800/50 hover:-translate-y-0.5 transition-all"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[15px]">{quiz.title}</p>
                      <p className="text-sm text-[var(--muted)] mt-0.5">
                        {quiz.biblePortion}
                      </p>
                    </div>
                    <span className={`shrink-0 px-3 py-1 rounded-lg text-xs font-semibold ${
                      !userId
                        ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                        : attempted === true
                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                        : attempted === false
                        ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                        : "bg-gradient-to-r from-emerald-500 to-green-500 text-white"
                    }`}>
                      {!userId
                        ? "Sign in"
                        : attempted === true
                        ? "Completed"
                        : attempted === false
                        ? "Continue"
                        : "Start Quiz"}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-[var(--muted)]">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {quiz.questionCount} questions
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      {quiz._count.attempts} participants
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
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
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
              Upcoming
            </h2>
            {upcomingQuizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="card p-5"
              >
                <p className="font-semibold text-[15px]">{quiz.title}</p>
                <p className="text-sm text-[var(--muted)] mt-0.5">
                  {quiz.biblePortion}
                </p>
                <div className="mt-3 flex items-center gap-4 text-xs text-[var(--muted)]">
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {quiz.questionCount} questions
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
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
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
              Past Quizzes
            </h2>
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
                  className="block card p-5 hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[15px]">{quiz.title}</p>
                      <p className="text-sm text-[var(--muted)] mt-0.5">
                        {quiz.biblePortion}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 px-3 py-1 rounded-lg text-xs font-semibold ${
                        attempted != null
                          ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                          : "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                      }`}
                    >
                      {attempted != null ? "Attempted" : "Missed"}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-[var(--muted)]">
                    <span>{quiz.questionCount} questions</span>
                    <span>{quiz._count.attempts} participants</span>
                    {quiz.resultsProcessed && (
                      <span className="text-[var(--accent)] font-medium">
                        View results
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </section>
        )}

        {quizzes.length === 0 && (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--accent-soft)] flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <p className="text-lg font-semibold">No quizzes yet</p>
            <p className="text-sm text-[var(--muted)] mt-1">Check back soon for new quizzes!</p>
          </div>
        )}

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)] flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              Leaderboard
            </h2>
            <div className="card overflow-hidden divide-y divide-[var(--card-border)]">
              {leaderboard.map((entry, i) => (
                <div
                  key={entry.userId}
                  className={`flex items-center gap-3 px-5 py-3.5 transition-colors ${
                    userId && entry.userId === userId
                      ? "bg-[var(--accent-soft)]"
                      : "hover:bg-[var(--surface)]"
                  }`}
                >
                  <span
                    className={`w-7 text-center text-sm font-bold ${
                      i === 0
                        ? "rank-gold"
                        : i === 1
                        ? "rank-silver"
                        : i === 2
                        ? "rank-bronze"
                        : "text-[var(--muted)]"
                    }`}
                  >
                    {i + 1}
                  </span>
                  {entry.user.image ? (
                    <img
                      src={entry.user.image}
                      alt=""
                      className="w-8 h-8 rounded-full ring-2 ring-[var(--card-border)]"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                      {(entry.user.name || "?")[0].toUpperCase()}
                    </div>
                  )}
                  <span className="flex-1 text-sm font-medium truncate">
                    {entry.user.name || "Anonymous"}
                    {userId && entry.userId === userId && (
                      <span className="ml-1.5 text-xs text-[var(--accent)]">(you)</span>
                    )}
                  </span>
                  <span className="text-sm font-bold tabular-nums">
                    {Number(entry.totalScore)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-2xl mx-auto px-4 py-8 text-center">
        <p className="text-xs text-[var(--muted)]">
          Mahanaimype Church Bible Quiz Platform
        </p>
      </footer>
    </div>
  );
}
