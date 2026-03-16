import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";

export default async function EditQuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") redirect("/");

  const { id: quizId } = await params;

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: { orderBy: { orderIndex: "asc" } },
      attempts: {
        where: { isComplete: true },
        include: { user: { select: { name: true, email: true } } },
        orderBy: { completedAt: "asc" },
      },
    },
  });

  if (!quiz) redirect("/admin");

  const now = new Date();
  const isEditable = now < quiz.startTime;
  const isEnded = now > quiz.endTime;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{quiz.title}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {quiz.biblePortion}
            </p>
          </div>
          <Link
            href="/admin"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Back to Dashboard
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400">Start</p>
            <p className="text-sm font-medium mt-1">
              {quiz.startTime.toLocaleString()}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400">End</p>
            <p className="text-sm font-medium mt-1">
              {quiz.endTime.toLocaleString()}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400">Questions</p>
            <p className="text-sm font-medium mt-1">{quiz.questionCount}</p>
          </div>
          <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400">Submissions</p>
            <p className="text-sm font-medium mt-1">{quiz.attempts.length}</p>
          </div>
        </div>

        {/* Questions */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Questions</h2>
          <div className="space-y-3">
            {quiz.questions.map((q, i) => (
              <div
                key={q.id}
                className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Q{i + 1} ({q.answerType})
                </p>
                <p className="font-medium mt-1">{q.questionText}</p>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  Answers: {q.acceptedAnswers.join(", ")}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Submissions */}
        {quiz.attempts.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-3">Submissions</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-2 px-2 font-medium text-slate-500">Name</th>
                    <th className="text-left py-2 px-2 font-medium text-slate-500">Email</th>
                    <th className="text-left py-2 px-2 font-medium text-slate-500">Completed</th>
                    {isEnded && quiz.resultsProcessed && (
                      <th className="text-left py-2 px-2 font-medium text-slate-500">Score</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {quiz.attempts.map((a) => (
                    <tr key={a.id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-2 px-2">{a.user.name || "—"}</td>
                      <td className="py-2 px-2">{a.user.email}</td>
                      <td className="py-2 px-2">
                        {a.completedAt?.toLocaleString() || "—"}
                      </td>
                      {isEnded && quiz.resultsProcessed && (
                        <td className="py-2 px-2 font-medium">
                          {Number(a.rawScore ?? 0) + Number(a.bonusPoints ?? 0)}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {isEnded && (
          <Link
            href={`/admin/quizzes/${quizId}/disputes`}
            className="block w-full text-center py-3 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium hover:bg-amber-200 dark:hover:bg-amber-900/50"
          >
            View Disputes
          </Link>
        )}
      </main>
    </div>
  );
}
