"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type LeaderboardEntry = {
  rank: number;
  user_id: string;
  name: string | null;
  image: string | null;
  score: number;
};

type ClosedQuiz = {
  id: string;
  title: string;
};

export function Leaderboard({ userId }: { userId: string }) {
  const [tab, setTab] = useState<"overall" | "quiz">("overall");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [quizzes, setQuizzes] = useState<ClosedQuiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tab === "overall") {
      setLoading(true);
      fetch("/api/leaderboard?type=overall")
        .then((r) => r.json())
        .then((data) => {
          setEntries(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [tab]);

  useEffect(() => {
    if (tab === "quiz") {
      fetch("/api/leaderboard/quizzes")
        .then((r) => r.json())
        .then((data) => setQuizzes(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, [tab]);

  useEffect(() => {
    if (tab === "quiz" && selectedQuiz) {
      setLoading(true);
      fetch(`/api/leaderboard?type=quiz&quiz_id=${selectedQuiz}`)
        .then((r) => r.json())
        .then((data) => {
          setEntries(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [tab, selectedQuiz]);

  const maxScore = entries.length > 0 ? entries[0].score : 1;
  const shown = expanded ? entries : entries.slice(0, 10);

  return (
    <section>
      <h3 className="text-lg font-semibold mb-3">Leaderboard</h3>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab("overall")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "overall"
              ? "bg-blue-600 text-white"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
          }`}
        >
          Overall
        </button>
        <button
          onClick={() => setTab("quiz")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "quiz"
              ? "bg-blue-600 text-white"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
          }`}
        >
          By Quiz
        </button>
      </div>

      {tab === "quiz" && (
        <select
          value={selectedQuiz}
          onChange={(e) => setSelectedQuiz(e.target.value)}
          className="w-full mb-4 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
        >
          <option value="">Select a quiz...</option>
          {quizzes.map((q) => (
            <option key={q.id} value={q.id}>
              {q.title}
            </option>
          ))}
        </select>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-12 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse"
            />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No scores yet.
        </p>
      ) : (
        <div className="space-y-2">
          {shown.map((entry) => (
            <div
              key={entry.user_id}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                entry.user_id === userId
                  ? "bg-blue-50 dark:bg-blue-900/30"
                  : "bg-white dark:bg-slate-800"
              }`}
            >
              <span className="w-6 text-sm font-medium text-slate-500 dark:text-slate-400">
                {entry.rank}
              </span>
              {entry.image ? (
                <Image
                  src={entry.image}
                  alt=""
                  width={28}
                  height={28}
                  className="rounded-full"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700" />
              )}
              <span className="flex-1 text-sm truncate">
                {entry.name || "Anonymous"}
              </span>
              <div className="flex items-center gap-2 w-24">
                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${(entry.score / maxScore) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-8 text-right">
                  {entry.score}
                </span>
              </div>
            </div>
          ))}

          {entries.length > 10 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full text-center text-sm text-blue-600 dark:text-blue-400 py-2"
            >
              {expanded ? "Show less" : `Show all ${entries.length}`}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
