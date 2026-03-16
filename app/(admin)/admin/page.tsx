import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";

export default async function AdminDashboard() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") redirect("/");

  const now = new Date();

  const [totalUsers, totalQuizzes, activeQuiz, quizzes] = await Promise.all([
    prisma.user.count(),
    prisma.quiz.count(),
    prisma.quiz.findFirst({
      where: { startTime: { lte: now }, endTime: { gte: now } },
    }),
    prisma.quiz.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { attempts: true } } },
    }),
  ]);

  const getStatus = (quiz: { startTime: Date; endTime: Date }) => {
    if (now < quiz.startTime) return "Upcoming";
    if (now <= quiz.endTime) return "Active";
    return "Ended";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Users</p>
            <p className="text-2xl font-bold mt-1">{totalUsers}</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Quizzes</p>
            <p className="text-2xl font-bold mt-1">{totalQuizzes}</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">Active Quiz</p>
            <p className="text-lg font-bold mt-1 truncate">
              {activeQuiz?.title || "None"}
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/quizzes/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Create Quiz
          </Link>
          <Link
            href="/admin/users"
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            Manage Users
          </Link>
        </div>

        {/* Quiz Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-3 px-2 font-medium text-slate-500 dark:text-slate-400">
                  Title
                </th>
                <th className="text-left py-3 px-2 font-medium text-slate-500 dark:text-slate-400">
                  Status
                </th>
                <th className="text-left py-3 px-2 font-medium text-slate-500 dark:text-slate-400">
                  Attempts
                </th>
                <th className="text-left py-3 px-2 font-medium text-slate-500 dark:text-slate-400">
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
                    className="border-b border-slate-100 dark:border-slate-800"
                  >
                    <td className="py-3 px-2">{quiz.title}</td>
                    <td className="py-3 px-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          status === "Active"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                            : status === "Upcoming"
                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="py-3 px-2">{quiz._count.attempts}</td>
                    <td className="py-3 px-2 space-x-2">
                      <Link
                        href={`/admin/quizzes/${quiz.id}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        View
                      </Link>
                      {status === "Ended" && (
                        <Link
                          href={`/admin/quizzes/${quiz.id}/disputes`}
                          className="text-amber-600 dark:text-amber-400 hover:underline"
                        >
                          Disputes
                        </Link>
                      )}
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
