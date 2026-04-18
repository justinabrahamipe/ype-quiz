import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id: quizId } = await params;

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { questions: { orderBy: { orderIndex: "asc" } } },
  });

  if (!quiz) redirect("/");

  // If quiz is still active, redirect
  if (new Date() < quiz.endTime) {
    redirect(`/quiz/${quizId}`);
  }

  const attempt = await prisma.attempt.findUnique({
    where: { quizId_userId: { quizId, userId: session.user.id } },
    include: { answers: true },
  });

  const activeAttempt = attempt?.archivedAt ? null : attempt;

  const answerMap = new Map(
    activeAttempt?.answers.map((a) => [a.questionId, a]) ?? []
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{quiz.title}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {quiz.biblePortion}
          </p>
        </div>

        <div className="space-y-3">
          {quiz.questions.map((q, i) => {
            const ans = answerMap.get(q.id);
            return (
              <div
                key={q.id}
                className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Question {i + 1}
                </p>
                <p className="font-medium mt-1">{q.questionText}</p>
                <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                  Correct: {q.acceptedAnswers.join(", ")}
                </p>
                {ans && (
                  <div className="flex items-center gap-2 mt-2 text-sm">
                    <span>{ans.isCorrect ? "\u2705" : "\u274C"}</span>
                    <span>
                      Your answer:{" "}
                      <span className="font-medium">
                        {ans.submittedText || "(no answer)"}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <Link
          href="/"
          className="block w-full text-center py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Back
        </Link>
      </main>
    </div>
  );
}
