import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { QualifyingQuizButton } from "@/components/qualifying-quiz-button";

export default async function AdminDashboard() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "admin" && session.user.role !== "quizmaster")) redirect("/");
  const isAdmin = session.user.role === "admin";

  const now = new Date();

  const [totalUsers, totalQuizzes, activeQuiz, quizzes, hasPrerequisite] = await Promise.all([
    prisma.user.count(),
    prisma.quiz.count(),
    prisma.quiz.findFirst({
      where: { startTime: { lte: now }, endTime: { gte: now } },
    }),
    prisma.quiz.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { attempts: true } } },
    }),
    prisma.quiz.findFirst({ where: { isPrerequisite: true }, select: { id: true } }),
  ]);

  const getStatus = (quiz: { startTime: Date; endTime: Date; isPrerequisite: boolean }) => {
    if (quiz.isPrerequisite) return "Qualifying";
    if (now < quiz.startTime) return "Upcoming";
    if (now <= quiz.endTime) return "Active";
    return "Ended";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <h1 className="text-2xl font-bold gradient-text">Admin Dashboard</h1>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card p-5 gradient-card">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">Total Users</p>
            <p className="text-3xl font-bold mt-2 gradient-text">{totalUsers}</p>
          </div>
          <div className="card p-5 gradient-card">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">Total Quizzes</p>
            <p className="text-3xl font-bold mt-2 gradient-text">{totalQuizzes}</p>
          </div>
          <div className="card p-5 gradient-card">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">Active Quiz</p>
            <p className="text-lg font-bold mt-2 truncate">
              {activeQuiz?.title || "None"}
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/quizzes/new"
            className="btn-primary inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Create Quiz
          </Link>
          {isAdmin && (
            <Link
              href="/admin/users"
              className="px-5 py-2.5 rounded-xl text-sm font-medium border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--surface)] transition-colors"
            >
              Manage Users
            </Link>
          )}
          {!hasPrerequisite && <QualifyingQuizButton />}
        </div>

        {/* Quiz Table */}
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--card-border)]">
                <th className="text-left py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                  Title
                </th>
                <th className="text-left py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                  Status
                </th>
                <th className="text-left py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                  Attempts
                </th>
                <th className="text-left py-3.5 px-5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {quizzes.map((quiz) => {
                const status = getStatus(quiz);
                return (
                  <tr
                    key={quiz.id}
                    className="border-b border-[var(--card-border)] last:border-0 hover:bg-[var(--surface)] transition-colors"
                  >
                    <td className="py-3.5 px-5 font-medium">{quiz.title}</td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          status === "Active"
                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                            : status === "Upcoming"
                            ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                            : status === "Qualifying"
                            ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                            : "bg-[var(--surface)] text-[var(--muted)]"
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 tabular-nums">{quiz._count.attempts}</td>
                    <td className="py-3.5 px-5 space-x-3">
                      <Link
                        href={`/admin/quizzes/${quiz.id}`}
                        className="text-[var(--accent)] hover:underline font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
