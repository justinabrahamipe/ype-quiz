import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { DisputeButton } from "../results/dispute-button";

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

  // If quiz window closed and results processed, go to results
  if (new Date() > quiz.endTime && quiz.resultsProcessed) {
    redirect(`/quiz/${quizId}/results`);
  }

  const attempt = await prisma.attempt.findUnique({
    where: { quizId_userId: { quizId, userId: session.user.id } },
    include: {
      answers: {
        include: { question: true, dispute: true },
        orderBy: { question: { orderIndex: "asc" } },
      },
    },
  });

  if (!attempt) redirect(`/quiz/${quizId}`);

  // For prerequisite quizzes, show immediate results
  if (quiz.isPrerequisite && attempt.rawScore !== null) {
    const score = Number(attempt.rawScore);
    const total = quiz.questionCount;
    const percentage = Math.round((score / total) * 100);
    const passed = percentage >= 70;

    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-lg mx-auto px-3 py-4 space-y-4">
          <div className="text-center space-y-3">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
              passed
                ? "bg-emerald-100 dark:bg-emerald-900/30"
                : "bg-red-100 dark:bg-red-900/30"
            }`}>
              {passed ? (
                <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <h1 className="text-2xl font-bold">
              {passed ? "Congratulations! You passed!" : "Not quite there yet"}
            </h1>
            <p className="text-3xl font-bold gradient-text">
              {score}/{total} ({percentage}%)
            </p>
            <p className="text-sm text-[var(--muted)]">
              {passed
                ? "You are now qualified to participate in all quizzes and appear on the leaderboard!"
                : "You need at least 70% to qualify. Review the questions below and try again."}
            </p>
          </div>

          <div className="space-y-2">
            {attempt.answers.map((ans, i) => {
              const correct = ans.isCorrect === true;
              const wrong = ans.isCorrect === false;
              return (
              <div
                key={ans.id}
                className={`p-4 rounded-xl border ${
                  correct
                    ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800"
                    : wrong
                    ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                }`}
              >
                <p className="text-sm text-[var(--muted)] mb-1">
                  Question {i + 1}
                </p>
                <p className="font-medium">{ans.question.questionText}</p>
                <p className="mt-2 text-sm">
                  Your answer:{" "}
                  <span className={`font-medium ${
                    correct
                      ? "text-emerald-600 dark:text-emerald-400"
                      : wrong
                      ? "text-red-600 dark:text-red-400"
                      : ""
                  }`}>
                    {ans.submittedText || "(no answer)"}
                  </span>
                </p>
                {wrong && (
                  <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400">
                    Correct: {ans.question.acceptedAnswers[0]}
                  </p>
                )}
                {!ans.dispute && (
                  <DisputeButton answerId={ans.id} />
                )}
                {ans.dispute && (
                  <p className="text-xs mt-2 text-[var(--muted)]">
                    Dispute {ans.dispute.status}
                  </p>
                )}
              </div>
              );
            })}
          </div>

          <Link
            href="/"
            className="block w-full text-center py-3 rounded-xl btn-primary"
          >
            Back to Home
          </Link>
        </main>
      </div>
    );
  }

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
          href="/"
          className="block w-full text-center py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
        >
          Back to Home
        </Link>
      </main>
    </div>
  );
}
