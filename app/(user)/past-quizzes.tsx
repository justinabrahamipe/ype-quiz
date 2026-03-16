"use client";

import Link from "next/link";

type PastQuiz = {
  id: string;
  title: string;
  biblePortion: string;
  endTime: string;
  resultsProcessed: boolean;
  userScore: number | null;
  attempted: boolean;
  questionCount: number;
};

export function PastQuizzes({ quizzes }: { quizzes: PastQuiz[] }) {
  if (quizzes.length === 0) return null;

  return (
    <section>
      <h3 className="text-lg font-semibold mb-3">Past Quizzes</h3>
      <div className="space-y-3">
        {quizzes.map((quiz) => (
          <Link
            key={quiz.id}
            href={`/quiz/${quiz.id}/review`}
            className="block p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">{quiz.title}</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {quiz.biblePortion}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  {new Date(quiz.endTime).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="text-right">
                {quiz.attempted && quiz.userScore !== null ? (
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {quiz.userScore}/{quiz.questionCount}
                  </span>
                ) : quiz.attempted ? (
                  <span className="text-xs text-slate-400">Processing...</span>
                ) : (
                  <span className="text-xs text-slate-400">Not attempted</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
