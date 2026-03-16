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

  const questionStartRef = useRef<string>(new Date().toISOString());
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Start the quiz
  useEffect(() => {
    fetch(`/api/quiz/${quizId}/start`, { method: "POST" })
      .then((r) => {
        if (!r.ok) {
          router.push("/");
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setQuestions(data.questions);
        setAttemptId(data.attemptId);
        setCurrentIndex(data.nextQuestionIndex);
        setExistingAnswers(
          new Map(data.existingAnswers.map((a: ExistingAnswer) => [a.questionId, a.submittedText || ""]))
        );
        setLoading(false);
      })
      .catch(() => router.push("/"));
  }, [quizId, router]);

  // Reset timer when question changes
  useEffect(() => {
    if (loading) return;
    setTimeLeft(120);
    questionStartRef.current = new Date().toISOString();

    // Check if this question already has an answer
    const q = questions[currentIndex];
    if (q && existingAnswers.has(q.id)) {
      setAnswer(existingAnswers.get(q.id) || "");
    } else {
      setAnswer("");
    }
  }, [currentIndex, loading, questions, existingAnswers]);

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
    try {
      await fetch(`/api/quiz/${quizId}/complete`, { method: "POST" });
      router.push(`/quiz/${quizId}/submitted`);
    } catch {
      toast("Failed to submit quiz", "error");
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
  const isPreviousQuestion = (idx: number) => idx < currentIndex;

  // Timer ring colors
  const timerColor =
    timeLeft > 60 ? "#16a34a" : timeLeft > 30 ? "#d97706" : "#dc2626";
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference * (1 - timeLeft / 120);

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
            <span>
              Question {currentIndex + 1} of {questions.length}
            </span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{
                width: `${((currentIndex + 1) / questions.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Timer */}
        <div className="flex justify-center">
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                className="text-slate-200 dark:text-slate-700"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={timerColor}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="text-xl font-bold"
                style={{ color: timerColor }}
              >
                {timeLeft}
              </span>
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <p className="text-lg font-medium leading-relaxed">
            {currentQuestion.questionText}
          </p>
        </div>

        {/* Answer input */}
        {existingAnswers.has(currentQuestion.id) &&
        isPreviousQuestion(currentIndex) ? (
          <div className="relative">
            <input
              type="text"
              value={existingAnswers.get(currentQuestion.id) || ""}
              disabled
              className="w-full px-4 py-4 text-lg rounded-xl bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500"
            />
            <svg
              className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
        ) : (
          <div>
            <input
              type={currentQuestion.answerType === "number" ? "number" : "text"}
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
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3">
          {currentIndex > 0 && (
            <button
              onClick={() => setCurrentIndex((prev) => prev - 1)}
              className="flex-1 py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={submitting}
            className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {submitting
              ? "Submitting..."
              : isLast
              ? "Submit Quiz"
              : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
