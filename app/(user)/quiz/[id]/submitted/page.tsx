import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";

export default async function SubmittedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id: quizId } = await params;

  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  if (!quiz) redirect("/");

  // Prereq quizzes and closed regular quizzes both use /review as the canonical
  // "post-attempt" view.
  if (quiz.isPrerequisite || new Date() > quiz.endTime) {
    redirect(`/quiz/${quizId}/review`);
  }

  const attempt = await prisma.attempt.findUnique({
    where: { quizId_userId: { quizId, userId: session.user.id } },
    include: {
      answers: {
        include: { question: true },
        orderBy: { question: { orderIndex: "asc" } },
      },
    },
  });

  if (!attempt || attempt.archivedAt) redirect(`/quiz/${quizId}`);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Your answers have been submitted!</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Results will be revealed after{" "}
            {quiz.endTime.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}{" "}
            at{" "}
            {quiz.endTime.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        <div className="space-y-3">
          {attempt.answers.map((ans, i) => (
            <div
              key={ans.id}
              className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                Question {i + 1}
              </p>
              <p className="font-medium">{ans.question.questionText}</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Your answer:{" "}
                <span className="font-medium">
                  {ans.submittedText || "(no answer)"}
                </span>
              </p>
            </div>
          ))}
        </div>

        <Link
          href="/quizzes"
          className="block w-full text-center py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
        >
          Back to quizzes
        </Link>
      </main>
    </div>
  );
}
