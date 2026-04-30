"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { toast } from "@/components/toaster";
import { Header } from "@/components/header";

type Question = {
  id: string;
  questionText: string;
  answerType: "text" | "number" | "mcq";
  orderIndex: number;
  maxAnswerLength: number | null;
  choices: string[];
};

type ExistingAnswer = {
  questionId: string;
  submittedText: string | null;
  answeredAt: string | null;
  timeTakenSeconds: number | null;
};

type QuizInfo = {
  quiz: {
    title: string;
    biblePortion: string;
    questionCount: number;
    isPrerequisite: boolean;
    startTime: string;
    endTime: string;
    secondsPerQuestion: number;
  };
  status: "upcoming" | "active" | "ended";
  isStaff?: boolean;
  userApproved: boolean;
  userQualified: boolean;
  hasInProgress: boolean;
  hasCompleted: boolean;
};

export default function QuizAttemptPage() {
  const { id: quizId } = useParams<{ id: string }>();
  const router = useRouter();

  const [info, setInfo] = useState<QuizInfo | null>(null);
  const [infoError, setInfoError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [startingAttempt, setStartingAttempt] = useState(false);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [attemptId, setAttemptId] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [secondsPerQuestion, setSecondsPerQuestion] = useState(120);
  const [timeLeft, setTimeLeft] = useState(120);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [existingAnswers, setExistingAnswers] = useState<Map<string, string>>(new Map());
  const [timeSpent, setTimeSpent] = useState<Map<string, number>>(new Map());
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  const questionStartRef = useRef<string>(new Date().toISOString());
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const leavingRef = useRef(false);
  const lockedRef = useRef<Set<string>>(new Set());
  const advancingRef = useRef(false);
  const existingAnswersRef = useRef(existingAnswers);
  const timeSpentRef = useRef(timeSpent);
  const answerRef = useRef(answer);
  useEffect(() => {
    existingAnswersRef.current = existingAnswers;
  }, [existingAnswers]);
  useEffect(() => {
    timeSpentRef.current = timeSpent;
  }, [timeSpent]);
  useEffect(() => {
    answerRef.current = answer;
  }, [answer]);

  // Fetch quiz info on mount (for the intro screen)
  useEffect(() => {
    let cancelled = false;

    const fetchInfo = async (retries = 2) => {
      try {
        const r = await fetch(`/api/quiz/${quizId}/info`);
        if (!r.ok) {
          if (r.status === 401 && retries > 0) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            if (!cancelled) return fetchInfo(retries - 1);
            return;
          }
          const err = await r.json().catch(() => ({ error: "Quiz not found" }));
          if (!cancelled) setInfoError(err.error || "Quiz not found");
          return;
        }
        const data: QuizInfo = await r.json();
        if (!cancelled) setInfo(data);
      } catch {
        if (!cancelled) {
          if (retries > 0) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            if (!cancelled) return fetchInfo(retries - 1);
          } else {
            setInfoError("Failed to load quiz");
          }
        }
      }
    };

    fetchInfo();
    return () => { cancelled = true; };
  }, [quizId]);

  // Start the quiz (only fires when the user clicks the button on the intro)
  useEffect(() => {
    if (!started) return;
    let cancelled = false;

    const startQuiz = async (retries = 2) => {
      try {
        const r = await fetch(`/api/quiz/${quizId}/start`, { method: "POST" });
        if (!r.ok) {
          if (r.status === 401 && retries > 0) {
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
          if (typeof data.secondsPerQuestion === "number" && data.secondsPerQuestion > 0) {
            setSecondsPerQuestion(data.secondsPerQuestion);
          }
          setExistingAnswers(
            new Map(data.existingAnswers.map((a: ExistingAnswer) => [a.questionId, a.submittedText || ""]))
          );
          setTimeSpent(
            new Map(data.existingAnswers
              .filter((a: ExistingAnswer) => a.timeTakenSeconds != null)
              .map((a: ExistingAnswer) => [a.questionId, a.timeTakenSeconds as number]))
          );
          setLoading(false);
          setStartingAttempt(false);
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
  }, [quizId, router, started]);

  // Initialize the question whenever the user navigates to a new one.
  // Reads existingAnswers/timeSpent via ref so this effect does NOT re-run on
  // every keystroke save — otherwise typing would reset the timer and answer.
  useEffect(() => {
    if (loading) return;
    questionStartRef.current = new Date().toISOString();

    const q = questions[currentIndex];
    if (!q) return;

    const prior = existingAnswersRef.current.get(q.id);
    if (prior !== undefined) {
      setAnswer(prior);
      const spent = timeSpentRef.current.get(q.id) || 0;
      setTimeLeft(Math.max(0, secondsPerQuestion - spent));
    } else {
      setAnswer("");
      setTimeLeft(secondsPerQuestion);
      // Lock the question the moment it's shown: if the user leaves without
      // answering, the question is marked attempted server-side so they can't
      // see it (and its fresh timer) again.
      if (!lockedRef.current.has(q.id)) {
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
  }, [currentIndex, loading, questions, quizId, secondsPerQuestion]);

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
      window.history.pushState(null, "", window.location.href);
      setShowLeaveDialog(true);
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [loading]);

  const confirmLeave = () => {
    leavingRef.current = true;
    setShowLeaveDialog(false);
    window.history.go(-2);
  };

  // Timer countdown
  useEffect(() => {
    if (loading) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Auto-submit and advance
          handleSubmitAnswer(true);
          return secondsPerQuestion;
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

  // Debounced save on keystroke (text/number questions)
  const handleInputChange = (text: string) => {
    setAnswer(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveAnswer(text, true);
    }, 500);
  };

  // MCQ pick: instant save, no debounce. Next button enables immediately.
  const handleMcqPick = (choice: string) => {
    setAnswer(choice);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    saveAnswer(choice, true);
  };

  const handleSubmitAnswer = async (autoAdvance: boolean) => {
    if (advancingRef.current) return;
    advancingRef.current = true;
    setAdvancing(true);
    if (timerRef.current) clearInterval(timerRef.current);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    try {
      // Read via ref: this fires from setInterval, whose closure captures the
      // answer at currentIndex-change time. Without the ref, an MCQ pick the
      // user just made gets clobbered by a save of "" when the timer expires.
      await saveAnswer(answerRef.current, true);

      const isLast = currentIndex >= questions.length - 1;
      if (isLast) {
        await handleCompleteQuiz();
      } else if (autoAdvance) {
        setCurrentIndex((prev) => prev + 1);
      }
    } finally {
      advancingRef.current = false;
      setAdvancing(false);
    }
  };

  const handleNext = async () => {
    if (advancingRef.current) return;
    advancingRef.current = true;
    setAdvancing(true);
    if (timerRef.current) clearInterval(timerRef.current);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    try {
      await saveAnswer(answer, true);

      const isLast = currentIndex >= questions.length - 1;
      if (isLast) {
        await handleCompleteQuiz();
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    } finally {
      advancingRef.current = false;
      setAdvancing(false);
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

  if (!started) {
    if (infoError) {
      return (
        <div className="min-h-screen bg-background">
          <Header />
          <main className="max-w-lg mx-auto px-4 py-10 text-center space-y-4">
            <p className="text-slate-700 dark:text-slate-200">{infoError}</p>
            <button
              onClick={() => router.push("/quizzes")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700"
            >
              <ArrowBackRoundedIcon sx={{ fontSize: 18 }} />
              Back to quizzes
            </button>
          </main>
        </div>
      );
    }

    if (!info) {
      return (
        <div className="min-h-screen bg-background">
          <Header />
          <main className="flex items-center justify-center py-20">
            <div className="animate-pulse text-slate-500">Loading quiz...</div>
          </main>
        </div>
      );
    }

    const { quiz, status, isStaff, userApproved, userQualified, hasInProgress, hasCompleted } = info;
    const perQuestion = quiz.secondsPerQuestion || 120;
    const totalSeconds = quiz.questionCount * perQuestion;
    const totalMinutes = Math.ceil(totalSeconds / 60);
    const perQuestionLabel =
      perQuestion >= 60 && perQuestion % 60 === 0
        ? `${perQuestion / 60} min`
        : perQuestion >= 60
        ? `${Math.floor(perQuestion / 60)}m ${perQuestion % 60}s`
        : `${perQuestion}s`;

    let blockMessage: string | null = null;
    if (hasCompleted) blockMessage = "You've already submitted this quiz.";
    else if (!isStaff && !userApproved) blockMessage = "Your account is pending approval.";
    else if (!isStaff && !quiz.isPrerequisite && !userQualified) blockMessage = "Pass the qualifying quiz first to unlock this one.";
    else if (!isStaff && status === "upcoming") blockMessage = `This quiz opens at ${new Date(quiz.startTime).toLocaleString()}.`;
    else if (!isStaff && status === "ended") blockMessage = "This quiz has ended.";

    const staffPreviewNote =
      isStaff && (status !== "active" || !userApproved || (!quiz.isPrerequisite && !userQualified))
        ? status === "upcoming"
          ? `Preview mode — quiz opens at ${new Date(quiz.startTime).toLocaleString()}. Your attempt won't count.`
          : status === "ended"
          ? "Preview mode — quiz has ended. Your attempt won't count."
          : "Preview mode — your attempt won't count."
        : null;

    const canStart = blockMessage === null;
    const buttonLabel = hasInProgress ? "Resume Quiz" : "Start Quiz";

    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-lg mx-auto px-4 py-8 space-y-5">
          <button
            onClick={() => router.push("/quizzes")}
            className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          >
            <ArrowBackRoundedIcon sx={{ fontSize: 18 }} />
            Back to quizzes
          </button>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-5">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {quiz.isPrerequisite ? "Qualifying Quiz" : "Bible Quiz"}
              </p>
              <h1 className="text-2xl font-bold">{quiz.title}</h1>
              <p className="text-sm text-slate-600 dark:text-slate-300">{quiz.biblePortion}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">Questions</p>
                <p className="text-lg font-semibold mt-0.5">{quiz.questionCount}</p>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">Time per question</p>
                <p className="text-lg font-semibold mt-0.5">{perQuestionLabel}</p>
              </div>
            </div>

            <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1.5 list-disc pl-5">
              <li>You have {perQuestionLabel} per question. Once time runs out, the next question loads automatically.</li>
              <li>You can&apos;t go back to a previous question.</li>
              <li>Plan for about {totalMinutes} minute{totalMinutes === 1 ? "" : "s"} of focused time.</li>
            </ul>

            {blockMessage && (
              <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
                {blockMessage}
              </div>
            )}

            {staffPreviewNote && (
              <div className="rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 px-3 py-2 text-sm text-indigo-800 dark:text-indigo-200">
                {staffPreviewNote}
              </div>
            )}

            <button
              onClick={() => {
                if (!canStart) return;
                setStartingAttempt(true);
                setStarted(true);
              }}
              disabled={!canStart || startingAttempt}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {startingAttempt && (
                <span
                  aria-hidden
                  className="inline-block w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin"
                />
              )}
              <span>{startingAttempt ? "Starting..." : buttonLabel}</span>
            </button>
          </div>
        </main>
      </div>
    );
  }

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
            if (!submitting && !advancing) handleNext();
          }}
        >
          {currentQuestion.answerType === "mcq" ? (
            <div className="space-y-2">
              {currentQuestion.choices.map((choice) => {
                const selected = answer === choice;
                return (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => handleMcqPick(choice)}
                    className={`w-full text-left px-4 py-3.5 rounded-xl border-2 text-base transition-colors ${
                      selected
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 font-semibold"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-600"
                    }`}
                  >
                    {choice}
                  </button>
                );
              })}
            </div>
          ) : (
            <input
              key={currentQuestion.id}
              type="text"
              inputMode={currentQuestion.answerType === "number" ? "numeric" : "text"}
              pattern={currentQuestion.answerType === "number" ? "[0-9]*" : undefined}
              enterKeyHint={isLast ? "done" : "next"}
              value={answer}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Type your answer here..."
              autoFocus
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoComplete="off"
              name="quiz-answer"
              maxLength={currentQuestion.maxAnswerLength ?? undefined}
              className="w-full px-4 py-4 text-lg rounded-xl bg-white dark:bg-slate-800 border-2 border-blue-300 dark:border-blue-600 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none transition-colors"
            />
          )}
          {currentQuestion.answerType !== "mcq" && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
              {currentQuestion.answerType === "number" && "Enter a number (exact)"}
              <span className="hidden sm:inline">
                {currentQuestion.answerType === "number" ? " · " : ""}press Enter to continue
              </span>
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || advancing || (currentQuestion.answerType === "mcq" && !answer)}
            className="mt-4 w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {(submitting || advancing) && (
              <span
                aria-hidden
                className="inline-block w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin"
              />
            )}
            <span>
              {submitting
                ? "Submitting..."
                : advancing
                ? isLast
                  ? "Submitting..."
                  : "Loading..."
                : isLast
                ? "Submit Quiz"
                : "Next"}
            </span>
          </button>
        </form>
      </div>

      <Dialog
        open={showLeaveDialog}
        onClose={() => setShowLeaveDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, mx: 2 } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            pb: 1,
          }}
        >
          <WarningAmberRoundedIcon sx={{ color: "warning.main" }} />
          Leave quiz?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: "0.95rem" }}>
            If you leave now, you won&apos;t be able to answer this question
            again. Your progress on other questions will be kept.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => setShowLeaveDialog(false)}
            variant="contained"
            color="primary"
            disableElevation
            sx={{ flex: 1 }}
          >
            Stay
          </Button>
          <Button
            onClick={confirmLeave}
            variant="outlined"
            color="warning"
            sx={{ flex: 1 }}
          >
            Leave
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
