import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { DisputeButton } from "./dispute-button";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id: quizId } = await params;

  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  if (!quiz) redirect("/");

  // If window still open, redirect to submitted
  if (new Date() < quiz.endTime) {
    redirect(`/quiz/${quizId}/submitted`);
  }

  const attempt = await prisma.attempt.findUnique({
    where: { quizId_userId: { quizId, userId: session.user.id } },
    include: {
      answers: {
        include: {
          question: true,
          dispute: true,
        },
        orderBy: { question: { orderIndex: "asc" } },
      },
    },
  });

  if (!attempt) redirect("/");

  const score = Number(attempt.rawScore ?? 0);
  const bonus = Number(attempt.bonusPoints ?? 0);
  const total = score + bonus;

  // Get rank
  const allAttempts = await prisma.attempt.findMany({
    where: { quizId, isComplete: true },
    orderBy: { rawScore: "desc" },
  });

  const rank =
    allAttempts.findIndex((a) => a.userId === session.user.id) + 1;

  const shareText = `I scored ${score}/${quiz.questionCount} on the ${quiz.title}! \uD83C\uDF89`;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Score */}
        <div className="text-center space-y-3">
          <div className="text-5xl font-bold text-blue-600 dark:text-blue-400">
            {score} / {quiz.questionCount}
          </div>
          {bonus > 0 && (
            <span className="inline-block px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-sm font-medium">
              +{bonus} bonus
            </span>
          )}
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Rank #{rank} of {allAttempts.length}
          </p>
        </div>

        {/* Breakdown */}
        <div className="space-y-3">
          {attempt.answers.map((ans, i) => (
            <div
              key={ans.id}
              className={`p-4 rounded-xl border ${
                ans.isCorrect
                  ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800"
              }`}
            >
              <div className="flex items-start justify-between">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Question {i + 1}
                </p>
                <span className="text-lg">
                  {ans.isCorrect ? "\u2705" : "\u274C"}
                </span>
              </div>
              <p className="font-medium mt-1">{ans.question.questionText}</p>
              <p className="text-sm mt-2">
                Your answer:{" "}
                <span className="font-medium">
                  {ans.submittedText || "(no answer)"}
                </span>
              </p>
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                Correct: {ans.question.acceptedAnswers.join(", ")}
              </p>

              {!ans.dispute && (
                <DisputeButton answerId={ans.id} />
              )}
              {ans.dispute && (
                <p className="text-xs mt-2 text-slate-500 dark:text-slate-400">
                  Dispute {ans.dispute.status}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors"
          >
            Share on WhatsApp
          </a>
          <Link
            href="/"
            className="block w-full text-center py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </main>
    </div>
  );
}
