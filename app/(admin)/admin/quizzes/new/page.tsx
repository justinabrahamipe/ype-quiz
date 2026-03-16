"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { toast } from "@/components/toaster";

type QuestionForm = {
  questionText: string;
  answerType: "text" | "number";
  acceptedAnswers: string[];
};

export default function CreateQuizPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [biblePortion, setBiblePortion] = useState("");
  const [startDate, setStartDate] = useState("");
  const [questionCount, setQuestionCount] = useState(10);
  const [questions, setQuestions] = useState<QuestionForm[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleNext = () => {
    if (!title || !biblePortion || !startDate || questionCount < 1) {
      toast("Please fill in all fields", "error");
      return;
    }
    setQuestions(
      Array.from({ length: questionCount }, () => ({
        questionText: "",
        answerType: "text" as const,
        acceptedAnswers: [""],
      }))
    );
    setStep(2);
  };

  const updateQuestion = (idx: number, field: keyof QuestionForm, value: string | string[]) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const addAnswer = (idx: number) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[idx] = {
        ...copy[idx],
        acceptedAnswers: [...copy[idx].acceptedAnswers, ""],
      };
      return copy;
    });
  };

  const removeAnswer = (qIdx: number, aIdx: number) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[qIdx] = {
        ...copy[qIdx],
        acceptedAnswers: copy[qIdx].acceptedAnswers.filter((_, i) => i !== aIdx),
      };
      return copy;
    });
  };

  const updateAnswer = (qIdx: number, aIdx: number, value: string) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const answers = [...copy[qIdx].acceptedAnswers];
      answers[aIdx] = value;
      copy[qIdx] = { ...copy[qIdx], acceptedAnswers: answers };
      return copy;
    });
  };

  const moveQuestion = (idx: number, direction: "up" | "down") => {
    const target = direction === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= questions.length) return;
    setQuestions((prev) => {
      const copy = [...prev];
      [copy[idx], copy[target]] = [copy[target], copy[idx]];
      return copy;
    });
  };

  const handleSubmit = async () => {
    // Validate
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) {
        toast(`Question ${i + 1} text is required`, "error");
        return;
      }
      const validAnswers = q.acceptedAnswers.filter((a) => a.trim());
      if (validAnswers.length === 0) {
        toast(`Question ${i + 1} needs at least one answer`, "error");
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          biblePortion,
          startDate,
          questionCount,
          questions: questions.map((q) => ({
            questionText: q.questionText,
            answerType: q.answerType,
            acceptedAnswers: q.acceptedAnswers.filter((a) => a.trim()),
          })),
        }),
      });

      if (res.ok) {
        toast("Quiz created!", "success");
        router.push("/admin");
      } else {
        const data = await res.json();
        toast(data.error || "Failed to create", "error");
      }
    } catch {
      toast("Failed to create quiz", "error");
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold">Create Quiz</h1>

        {step === 1 ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Quiz Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Genesis 1-10 Quiz"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Bible Portion
              </label>
              <input
                type="text"
                value={biblePortion}
                onChange={(e) => setBiblePortion(e.target.value)}
                placeholder="e.g. Book of Genesis, Chapters 1 to 10"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:outline-none"
              />
              <p className="text-xs text-slate-400 mt-1">
                Quiz starts at 12:00 noon and ends at 23:59 the next day (~36 hours)
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Number of Questions
              </label>
              <input
                type="number"
                value={questionCount}
                onChange={(e) => setQuestionCount(Math.max(1, parseInt(e.target.value) || 1))}
                min={1}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <button
              onClick={handleNext}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700"
            >
              Next: Add Questions
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {questions.map((q, qIdx) => (
              <div
                key={qIdx}
                className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Question {qIdx + 1}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => moveQuestion(qIdx, "up")}
                      disabled={qIdx === 0}
                      className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveQuestion(qIdx, "down")}
                      disabled={qIdx === questions.length - 1}
                      className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </div>
                </div>

                <textarea
                  value={q.questionText}
                  onChange={(e) => updateQuestion(qIdx, "questionText", e.target.value)}
                  placeholder="Question text..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:border-blue-500 focus:outline-none text-sm"
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => updateQuestion(qIdx, "answerType", "text")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                      q.answerType === "text"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 dark:bg-slate-700"
                    }`}
                  >
                    Text
                  </button>
                  <button
                    onClick={() => updateQuestion(qIdx, "answerType", "number")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                      q.answerType === "number"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 dark:bg-slate-700"
                    }`}
                  >
                    Number
                  </button>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Accepted Answers
                  </p>
                  {q.acceptedAnswers.map((ans, aIdx) => (
                    <div key={aIdx} className="flex gap-2">
                      <input
                        type={q.answerType === "number" ? "number" : "text"}
                        value={ans}
                        onChange={(e) => updateAnswer(qIdx, aIdx, e.target.value)}
                        placeholder={`Answer ${aIdx + 1}`}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:border-blue-500 focus:outline-none"
                      />
                      {q.acceptedAnswers.length > 1 && (
                        <button
                          onClick={() => removeAnswer(qIdx, aIdx)}
                          className="text-red-500 hover:text-red-700 text-sm px-2"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => addAnswer(qIdx)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    + Add another accepted answer
                  </button>
                </div>
              </div>
            ))}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-xl border border-slate-300 dark:border-slate-600 font-medium"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "Creating..." : "Publish Quiz"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
