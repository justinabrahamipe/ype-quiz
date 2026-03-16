"use client";

import Link from "next/link";
import { Countdown } from "@/components/countdown";

type Props = {
  quiz: {
    id: string;
    title: string;
    biblePortion: string;
    endTime: string;
    attemptCount: number;
  } | null;
  userCompleted: boolean;
};

export function ActiveQuizCard({ quiz, userCompleted }: Props) {
  if (!quiz) {
    return (
      <div className="rounded-2xl bg-slate-100 dark:bg-slate-800 p-6 text-center">
        <p className="text-slate-500 dark:text-slate-400">
          No active quiz right now. Check back soon!
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-blue-600 dark:bg-blue-700 text-white p-6 space-y-4">
      <div>
        <h2 className="text-xl font-bold">{quiz.title}</h2>
        <p className="text-blue-100 text-sm mt-1">{quiz.biblePortion}</p>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-blue-200">
          {quiz.attemptCount} {quiz.attemptCount === 1 ? "person has" : "people have"} attempted
        </span>
        <span className="font-medium">
          <Countdown endTime={quiz.endTime} />
        </span>
      </div>

      {userCompleted ? (
        <Link
          href={`/quiz/${quiz.id}/submitted`}
          className="block w-full text-center py-3 rounded-xl bg-white/20 text-white/70 cursor-default"
        >
          Already Completed
        </Link>
      ) : (
        <Link
          href={`/quiz/${quiz.id}`}
          className="block w-full text-center py-3 rounded-xl bg-white text-blue-600 font-semibold hover:bg-blue-50 transition-colors"
        >
          Attempt Quiz
        </Link>
      )}
    </div>
  );
}
