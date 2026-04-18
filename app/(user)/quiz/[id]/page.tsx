"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "@/components/toaster";

type Question = {
  id: string;
  questionText: string;
  answerType: "text" | "number";
  orderIndex: number;
};

type ExistingAnswer = {
  questionId: string;
  submittedText: string | null;
  answeredAt: string | null;
  timeTakenSeconds: number | null;
};

export default function QuizAttemptPage() {
  const { id: quizId } = useParams<{ id: string }>();
  const router = useRouter();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [attemptId, setAttemptId] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [timeLeft, setTimeLeft] = useState(120);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingAnswers, setExistingAnswers] = useState<Map<string, string>>(new Map());
  const [timeSpent, setTimeSpent] = useState<Map<string, number>>(new Map());

  const questionStartRef = useRef<string>(new Date().toISOString());
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const leavingRef = useRef(false);
  const lockedRef = useRef<Set<string>>(new Set());

  // Start the quiz
  useEffect(() => {
    let cancelled = false;

    const startQuiz = async (retries = 2) => {
      try {
        const r = await fetch(`/api/quiz/${quizId}/start`, { method: "POST" });
        if (!r.ok) {
          if (r.status === 401 && retries > 0) {
            // Session not ready yet — retry after short delay
            await new Promise((resolve) => setTimeout(resolve, 1000));
            if (!cancelled) return startQuiz(retries - 1);
            return;
          }
          const err = await r.json().catch(() => ({ error: "Failed to start quiz" }));
          if (!cancelled) {
            toast(err.error || "Cannot start quiz", "error");
            setTimeout(() => router.push("/"), 1500);
          }
          return;
        }
        const data = await r.json();
        if (!cancelled) {
          setQuestions(data.questions);
          setAttemptId(data.attemptId);
          setCurrentIndex(data.nextQuestionIndex);
          setExistingAnswers(
            new Map(data.existingAnswers.map((a: ExistingAnswer) => [a.questionId, a.submittedText || ""]))
          );
          setTimeSpent(
            new Map(data.existingAnswers
              .filter((a: ExistingAnswer) => a.timeTakenSeconds != null)
              .map((a: ExistingAnswer) => [a.questionId, a.timeTakenSeconds as number]))
          );
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          if (retries > 0) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            if (!cancelled) return startQuiz(retries - 1);
          } else {
            toast("Failed to load quiz", "error");
            setTimeout(() => router.push("/"), 1500);
          }
        }
      }
    };

    startQuiz();
    return () => { cancelled = true; };
  }, [quizId, router]);

  // Reset timer when question changes
  useEffect(() => {
    if (loading) return;
    questionStartRef.current = new Date().toISOString();

    const q = questions[currentIndex];
    if (q && existingAnswers.has(q.id)) {
      setAnswer(existingAnswers.get(q.id) || "");
      // Already answered — calculate remaining time
      const spent = timeSpent.get(q.id) || 0;
      setTimeLeft(Math.max(0, 120 - spent));
    } else {
      setAnswer("");
      setTimeLeft(120);
      // Lock the question the moment it's shown: if the user leaves without
      // answering, the question is marked attempted server-side so they can't
      // see it (and its fresh 120s timer) again.
      if (q && !lockedRef.current.has(q.id)) {
        lockedRef.current.add(q.id);
        fetch(`/api/quiz/${quizId}/answer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question_id: q.id,
            submitted_text: "",
            question_started_at: questionStartRef.current,
          }),
        })
          .then(() => {
            setExistingAnswers((prev) => {
              if (prev.has(q.id)) return prev;
              const next = new Map(prev);
              next.set(q.id, "");
              return next;
            });
          })
          .catch(() => {
            lockedRef.current.delete(q.id);
          });
      }
    }
  }, [currentIndex, loading, questions, existingAnswers, timeSpent, quizId]);

  // Warn before leaving — browser close/refresh
  useEffect(() => {
    if (loading) return;
    const handler = (e: BeforeUnloadEvent) => {
      if (leavingRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [loading]);

  // Warn before leaving — in-app back button (SPA)
  useEffect(() => {
    if (loading) return;
    window.history.pushState(null, "", window.location.href);
    const handler = () => {
      if (leavingRef.current) return;
      const ok = window.confirm(
        "Leave quiz? You won't be able to answer this question again."
      );
      if (ok) {
        leavingRef.current = true;
        window.history.back();
      } else {
        window.history.pushState(null, "", window.location.href);
      }
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [loading]);

  // Timer countdown
  useEffect(() => {
    if (loading) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Auto-submit and advance
          handleSubmitAnswer(true);
          return 120;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, loading, questions]);

  const saveAnswer = useCallback(
    async (text: string, autoAdvance: boolean) => {
      const q = questions[currentIndex];
      if (!q) return;

      try {
        const res = await fetch(`/api/quiz/${quizId}/answer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question_id: q.id,
            submitted_text: text,
            question_started_at: questionStartRef.current,
          }),
        });

        if (res.ok) {
          setExistingAnswers((prev) => new Map(prev).set(q.id, text));
          if (!autoAdvance) toast("Answer saved", "success");
        }
      } catch {
        toast("Failed to save", "error");
      }
    },
    [quizId, currentIndex, questions]
  );

  // Debounced save on keystroke
  const handleInputChange = (text: string) => {
    setAnswer(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveAnswer(text, true);
    }, 500);
  };

  const handleSubmitAnswer = async (autoAdvance: boolean) => {
    if (timerRef.current) clearInterval(timerRef.current);

    await saveAnswer(answer, true);

    const isLast = currentIndex >= questions.length - 1;
    if (isLast) {
      await handleCompleteQuiz();
    } else if (autoAdvance) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleNext = async () => {
    if (timerRef.current) clearInterval(timerRef.current);

    await saveAnswer(answer, true);

    const isLast = currentIndex >= questions.length - 1;
    if (isLast) {
      await handleCompleteQuiz();
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleCompleteQuiz = async () => {
    setSubmitting(true);
    leavingRef.current = true;
    try {
      const res = await fetch(`/api/quiz/${quizId}/complete`, { method: "POST" });
      const data = await res.json();
      if (data.isPrerequisite) {
        router.push(`/quiz/${quizId}/submitted`);
      } else {
        router.push(`/quiz/${quizId}/submitted`);
      }
    } catch {
      toast("Failed to submit quiz", "error");
      leavingRef.current = false;
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-slate-500">Loading quiz...</div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  if (!currentQuestion) return null;

  const isLast = currentIndex >= questions.length - 1;

  const timerColor =
    timeLeft > 60 ? "#16a34a" : timeLeft > 30 ? "#d97706" : "#dc2626";

  const formatTime = (t: number) => {
    if (t >= 60) {
      const m = Math.floor(t / 60);
      const s = t % 60;
      return s === 0 ? `${m} min` : `${m} min ${s}s`;
    }
    return `${t}s`;
  };

  return (
    <div className="min-h-screen bg-background px-4 py-5 flex flex-col justify-center focus-within:justify-start">
      <div className="max-w-lg w-full mx-auto space-y-5">
        {/* Progress + compact timer */}
        <div className="flex items-center gap-3">
          <div className="flex-1 space-y-1.5">
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>
                Question {currentIndex + 1} of {questions.length}
              </span>
            </div>
            <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentIndex + 1) / questions.length) * 100}%`,
                }}
              />
            </div>
          </div>
          <div
            className="flex items-center gap-1 px-2.5 py-1 rounded-full border text-sm font-semibold tabular-nums whitespace-nowrap"
            style={{ color: timerColor, borderColor: timerColor }}
            aria-label="Time remaining"
          >
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Question */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
          <p className="text-lg font-medium leading-relaxed">
            {currentQuestion.questionText}
          </p>
        </div>

        {/* Answer form — Enter/Go key advances to next question */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!submitting) handleNext();
          }}
        >
          <input
            type={currentQuestion.answerType === "number" ? "number" : "text"}
            inputMode={currentQuestion.answerType === "number" ? "numeric" : "text"}
            enterKeyHint={isLast ? "done" : "next"}
            value={answer}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Type your answer here..."
            autoFocus
            className="w-full px-4 py-4 text-lg rounded-xl bg-white dark:bg-slate-800 border-2 border-blue-300 dark:border-blue-600 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none transition-colors"
          />
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
            {currentQuestion.answerType === "number"
              ? "Enter a number (exact)"
              : "Single word answer"}
            <span className="hidden sm:inline"> · press Enter to continue</span>
          </p>

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {submitting
              ? "Submitting..."
              : isLast
              ? "Submit Quiz"
              : "Next"}
          </button>
        </form>
      </div>
    </div>
  );
}
