"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { toast } from "@/components/toaster";

type QuestionForm = {
  questionText: string;
  questionTextMl: string;
  answerType: "text" | "number" | "mcq";
  acceptedAnswers: string[];
  choices: string[];
  choicesMl: string[];
  correctIndex: number;
  maxAnswerLength: string;
};

const SAMPLE_QUIZ_JSON = {
  title: "Sample Quiz: Genesis 1-3",
  biblePortion: "Book of Genesis, Chapters 1 to 3",
  startDateTime: "2026-05-01T10:00",
  endDateTime: "2026-05-01T22:00",
  secondsPerQuestion: 120,
  isPrerequisite: false,
  hasMalayalam: false,
  // For bilingual quizzes set hasMalayalam: true and add questionTextMl + choicesMl
  // (matching choices length, same positional order). Text type is not allowed
  // in bilingual quizzes — only mcq and number.
  questions: [
    {
      questionText: "Who was the first man God created?",
      answerType: "mcq",
      choices: ["Adam", "Noah", "Abraham", "Moses"],
      correctIndex: 0,
    },
    {
      questionText: "How many days did God take to create the world?",
      answerType: "number",
      acceptedAnswers: ["6"],
      maxAnswerLength: 2,
    },
    {
      questionText: "What was the name of Adam's wife?",
      answerType: "text",
      acceptedAnswers: ["Eve"],
      maxAnswerLength: 10,
    },
  ],
};

export default function CreateQuizPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [biblePortion, setBiblePortion] = useState("");
  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  const [questionCount, setQuestionCount] = useState(10);
  const [secondsPerQuestion, setSecondsPerQuestion] = useState(120);
  const [isPrerequisite, setIsPrerequisite] = useState(false);
  const [hasMalayalam, setHasMalayalam] = useState(false);
  const [questions, setQuestions] = useState<QuestionForm[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadSample = () => {
    const blob = new Blob([JSON.stringify(SAMPLE_QUIZ_JSON, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "quiz-sample.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      toast("Invalid JSON file", "error");
      return;
    }
    if (!parsed || typeof parsed !== "object") {
      toast("JSON must be an object", "error");
      return;
    }
    const data = parsed as Record<string, unknown>;
    const rawQuestions = data.questions;
    if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
      toast("JSON must include a non-empty questions array", "error");
      return;
    }
    if (typeof data.title !== "string" || !data.title.trim()) {
      toast("title is required", "error");
      return;
    }
    if (typeof data.biblePortion !== "string" || !data.biblePortion.trim()) {
      toast("biblePortion is required", "error");
      return;
    }

    const isPrereq = !!data.isPrerequisite;
    if (!isPrereq) {
      if (typeof data.startDateTime !== "string" || typeof data.endDateTime !== "string") {
        toast("startDateTime and endDateTime are required (or set isPrerequisite: true)", "error");
        return;
      }
      if (new Date(data.endDateTime) <= new Date(data.startDateTime)) {
        toast("endDateTime must be after startDateTime", "error");
        return;
      }
    }

    const importedHasMl = !!data.hasMalayalam;

    const importedQuestions: QuestionForm[] = [];
    for (let i = 0; i < rawQuestions.length; i++) {
      const q = rawQuestions[i] as Record<string, unknown>;
      if (!q || typeof q.questionText !== "string" || !q.questionText.trim()) {
        toast(`Question ${i + 1}: questionText is required`, "error");
        return;
      }
      const answerType = q.answerType;
      if (answerType !== "mcq" && answerType !== "text" && answerType !== "number") {
        toast(`Question ${i + 1}: answerType must be "mcq", "text", or "number"`, "error");
        return;
      }
      if (importedHasMl && answerType === "text") {
        toast(`Question ${i + 1}: bilingual quizzes can't use text questions`, "error");
        return;
      }
      const questionTextMl = typeof q.questionTextMl === "string" ? q.questionTextMl.trim() : "";
      if (importedHasMl && !questionTextMl) {
        toast(`Question ${i + 1}: questionTextMl is required when hasMalayalam`, "error");
        return;
      }
      if (answerType === "mcq") {
        const choices = Array.isArray(q.choices) ? q.choices.map(String) : [];
        if (choices.filter((c) => c.trim()).length < 2) {
          toast(`Question ${i + 1}: MCQ needs at least 2 choices`, "error");
          return;
        }
        let correctIndex = -1;
        if (typeof q.correctIndex === "number") {
          correctIndex = q.correctIndex;
        } else if (typeof q.correctAnswer === "string") {
          correctIndex = choices.findIndex((c) => c === q.correctAnswer);
        } else if (Array.isArray(q.acceptedAnswers) && typeof q.acceptedAnswers[0] === "string") {
          const first = q.acceptedAnswers[0] as string;
          correctIndex = choices.findIndex((c) => c === first);
        }
        if (correctIndex < 0 || correctIndex >= choices.length || !choices[correctIndex].trim()) {
          toast(`Question ${i + 1}: pick a valid correct choice (correctIndex or correctAnswer)`, "error");
          return;
        }
        let choicesMl: string[] = [];
        if (importedHasMl) {
          choicesMl = Array.isArray(q.choicesMl) ? q.choicesMl.map(String) : [];
          if (choicesMl.length !== choices.length || choicesMl.some((c) => !c.trim())) {
            toast(`Question ${i + 1}: choicesMl must match choices count and be non-empty`, "error");
            return;
          }
        }
        const padded = [...choices];
        const paddedMl = [...choicesMl];
        while (padded.length < 4) {
          padded.push("");
          paddedMl.push("");
        }
        importedQuestions.push({
          questionText: q.questionText.trim(),
          questionTextMl,
          answerType: "mcq",
          acceptedAnswers: [choices[correctIndex]],
          choices: padded,
          choicesMl: paddedMl,
          correctIndex,
          maxAnswerLength: "40",
        });
      } else {
        const answers = Array.isArray(q.acceptedAnswers)
          ? q.acceptedAnswers.map(String).filter((a) => a.trim())
          : [];
        if (answers.length === 0) {
          toast(`Question ${i + 1}: at least one acceptedAnswer required`, "error");
          return;
        }
        importedQuestions.push({
          questionText: q.questionText.trim(),
          questionTextMl,
          answerType,
          acceptedAnswers: answers,
          choices: ["", "", "", ""],
          choicesMl: ["", "", "", ""],
          correctIndex: 0,
          maxAnswerLength:
            typeof q.maxAnswerLength === "number" && q.maxAnswerLength > 0
              ? String(Math.floor(q.maxAnswerLength))
              : "40",
        });
      }
    }

    setTitle(data.title.trim());
    setBiblePortion(data.biblePortion.trim());
    setIsPrerequisite(isPrereq);
    setHasMalayalam(importedHasMl);
    if (!isPrereq) {
      setStartDateTime(String(data.startDateTime));
      setEndDateTime(String(data.endDateTime));
    } else {
      setStartDateTime("");
      setEndDateTime("");
    }
    setQuestionCount(importedQuestions.length);
    if (typeof data.secondsPerQuestion === "number" && data.secondsPerQuestion > 0) {
      setSecondsPerQuestion(Math.floor(data.secondsPerQuestion));
    }
    setQuestions(importedQuestions);
    setStep(2);
    toast(`Imported ${importedQuestions.length} questions — review and publish`, "success");
  };

  const handleNext = () => {
    if (!title || !biblePortion || questionCount < 1) {
      toast("Please fill in all fields", "error");
      return;
    }
    if (!isPrerequisite && (!startDateTime || !endDateTime)) {
      toast("Please set start and end times", "error");
      return;
    }
    if (!isPrerequisite && new Date(endDateTime) <= new Date(startDateTime)) {
      toast("End time must be after start time", "error");
      return;
    }
    setQuestions(
      Array.from({ length: questionCount }, () => ({
        questionText: "",
        questionTextMl: "",
        answerType: "mcq" as const,
        acceptedAnswers: [""],
        choices: ["", "", "", ""],
        choicesMl: ["", "", "", ""],
        correctIndex: 0,
        maxAnswerLength: "40",
      }))
    );
    setStep(2);
  };

  const updateQuestion = (idx: number, field: keyof QuestionForm, value: string | string[] | number) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const updateChoice = (qIdx: number, cIdx: number, value: string) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const choices = [...copy[qIdx].choices];
      choices[cIdx] = value;
      copy[qIdx] = { ...copy[qIdx], choices };
      return copy;
    });
  };

  const updateChoiceMl = (qIdx: number, cIdx: number, value: string) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const choicesMl = [...copy[qIdx].choicesMl];
      choicesMl[cIdx] = value;
      copy[qIdx] = { ...copy[qIdx], choicesMl };
      return copy;
    });
  };

  const addChoice = (qIdx: number) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[qIdx] = {
        ...copy[qIdx],
        choices: [...copy[qIdx].choices, ""],
        choicesMl: [...copy[qIdx].choicesMl, ""],
      };
      return copy;
    });
  };

  const removeChoice = (qIdx: number, cIdx: number) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const choices = copy[qIdx].choices.filter((_, i) => i !== cIdx);
      const choicesMl = copy[qIdx].choicesMl.filter((_, i) => i !== cIdx);
      let correctIndex = copy[qIdx].correctIndex;
      if (cIdx === correctIndex) correctIndex = 0;
      else if (cIdx < correctIndex) correctIndex -= 1;
      copy[qIdx] = { ...copy[qIdx], choices, choicesMl, correctIndex };
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
      if (hasMalayalam) {
        if (q.answerType === "text") {
          toast(`Question ${i + 1}: text questions aren't allowed in bilingual quizzes`, "error");
          return;
        }
        if (!q.questionTextMl.trim()) {
          toast(`Question ${i + 1}: Malayalam question text required`, "error");
          return;
        }
      }
      if (q.answerType === "mcq") {
        const validChoices = q.choices.filter((c) => c.trim());
        if (validChoices.length < 2) {
          toast(`Question ${i + 1} needs at least 2 choices`, "error");
          return;
        }
        const correct = q.choices[q.correctIndex]?.trim();
        if (!correct) {
          toast(`Question ${i + 1}: pick a correct choice`, "error");
          return;
        }
        if (hasMalayalam) {
          const choicesMl = q.choices
            .map((c, idx) => ({ c: c.trim(), m: q.choicesMl[idx]?.trim() ?? "" }))
            .filter((p) => p.c);
          if (choicesMl.some((p) => !p.m)) {
            toast(`Question ${i + 1}: fill the Malayalam version of every choice`, "error");
            return;
          }
          if (!q.choicesMl[q.correctIndex]?.trim()) {
            toast(`Question ${i + 1}: Malayalam version of the correct choice is empty`, "error");
            return;
          }
        }
      } else {
        const validAnswers = q.acceptedAnswers.filter((a) => a.trim());
        if (validAnswers.length === 0) {
          toast(`Question ${i + 1} needs at least one answer`, "error");
          return;
        }
      }
    }

    setSubmitting(true);
    const now = new Date();
    const farFuture = new Date();
    farFuture.setFullYear(farFuture.getFullYear() + 10);

    try {
      const res = await fetch("/api/admin/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          biblePortion,
          startDateTime: isPrerequisite ? now.toISOString() : startDateTime,
          endDateTime: isPrerequisite ? farFuture.toISOString() : endDateTime,
          questionCount,
          secondsPerQuestion,
          isPrerequisite,
          hasMalayalam,
          questions: questions.map((q) => {
            if (q.answerType === "mcq") {
              const indices = q.choices
                .map((c, i) => ({ c: c.trim(), m: q.choicesMl[i]?.trim() ?? "", i }))
                .filter((p) => p.c);
              const choices = indices.map((p) => p.c);
              const choicesMl = hasMalayalam ? indices.map((p) => p.m) : [];
              const correct = q.choices[q.correctIndex]?.trim() || "";
              const correctMl = hasMalayalam ? (q.choicesMl[q.correctIndex]?.trim() || "") : "";
              return {
                questionText: q.questionText,
                questionTextMl: hasMalayalam ? q.questionTextMl.trim() : null,
                answerType: q.answerType,
                acceptedAnswers: [correct],
                acceptedAnswersMl: hasMalayalam && correctMl ? [correctMl] : [],
                choices,
                choicesMl,
                maxAnswerLength: null,
              };
            }
            return {
              questionText: q.questionText,
              questionTextMl: hasMalayalam ? q.questionTextMl.trim() : null,
              answerType: q.answerType,
              acceptedAnswers: q.acceptedAnswers.filter((a) => a.trim()),
              acceptedAnswersMl: [],
              choices: [],
              choicesMl: [],
              maxAnswerLength: q.maxAnswerLength.trim() === "" ? null : Number(q.maxAnswerLength),
            };
          }),
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
            <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 space-y-2">
              <p className="text-sm font-medium">Import a quiz from JSON</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload a JSON file to auto-fill the form. You&apos;ll be able to edit everything before publishing.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                >
                  Import JSON
                </button>
                <button
                  type="button"
                  onClick={downloadSample}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Download sample
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </div>
            </div>

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
            {!isPrerequisite && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={startDateTime}
                    onChange={(e) => setStartDateTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={endDateTime}
                    onChange={(e) => setEndDateTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </>
            )}
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
            <div>
              <label className="block text-sm font-medium mb-1">
                Seconds per Question
              </label>
              <input
                type="number"
                value={secondsPerQuestion}
                onChange={(e) => setSecondsPerQuestion(Math.max(1, parseInt(e.target.value) || 1))}
                min={1}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:outline-none"
              />
              <p className="text-xs text-slate-400 mt-1">How long users get per question. Default 120.</p>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isPrerequisite}
                onChange={(e) => setIsPrerequisite(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600"
              />
              <div>
                <span className="text-sm font-medium">Prerequisite Quiz</span>
                <p className="text-xs text-slate-400">Users must score 70%+ to unlock regular quizzes</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hasMalayalam}
                onChange={(e) => setHasMalayalam(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600"
              />
              <div>
                <span className="text-sm font-medium">Bilingual (English + Malayalam)</span>
                <p className="text-xs text-slate-400">Each question must be entered in both languages. Only MCQ and number types are allowed.</p>
              </div>
            </label>
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
                  placeholder={hasMalayalam ? "Question (English)..." : "Question text..."}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:border-blue-500 focus:outline-none text-sm"
                />
                {hasMalayalam && (
                  <textarea
                    value={q.questionTextMl}
                    onChange={(e) => updateQuestion(qIdx, "questionTextMl", e.target.value)}
                    placeholder="Question (Malayalam)..."
                    rows={2}
                    dir="auto"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:border-blue-500 focus:outline-none text-sm"
                  />
                )}

                <div className="flex gap-2 items-center flex-wrap">
                  {(hasMalayalam ? (["mcq", "number"] as const) : (["mcq", "text", "number"] as const)).map((t) => (
                    <button
                      key={t}
                      onClick={() => updateQuestion(qIdx, "answerType", t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                        q.answerType === t
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 dark:bg-slate-700"
                      }`}
                    >
                      {t === "mcq" ? "MCQ" : t === "text" ? "Text" : "Number"}
                    </button>
                  ))}
                  {q.answerType !== "mcq" && (
                    <label className="ml-auto flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      Max length
                      <input
                        type="number"
                        min={1}
                        value={q.maxAnswerLength}
                        onChange={(e) => updateQuestion(qIdx, "maxAnswerLength", e.target.value)}
                        className="w-20 px-2 py-1 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </label>
                  )}
                </div>

                {q.answerType === "mcq" ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Choices (pick the correct one){hasMalayalam ? " — fill English and Malayalam" : ""}
                    </p>
                    {q.choices.map((choice, cIdx) => (
                      <div key={cIdx} className={`flex gap-2 ${hasMalayalam ? "items-start" : "items-center"}`}>
                        <input
                          type="radio"
                          name={`correct-${qIdx}`}
                          checked={q.correctIndex === cIdx}
                          onChange={() => updateQuestion(qIdx, "correctIndex", cIdx)}
                          className={`w-4 h-4 ${hasMalayalam ? "mt-2" : ""}`}
                        />
                        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                          <input
                            type="text"
                            value={choice}
                            onChange={(e) => updateChoice(qIdx, cIdx, e.target.value)}
                            placeholder={hasMalayalam ? `Choice ${cIdx + 1} (English)` : `Choice ${cIdx + 1}`}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:border-blue-500 focus:outline-none"
                          />
                          {hasMalayalam && (
                            <input
                              type="text"
                              dir="auto"
                              value={q.choicesMl[cIdx] ?? ""}
                              onChange={(e) => updateChoiceMl(qIdx, cIdx, e.target.value)}
                              placeholder={`Choice ${cIdx + 1} (Malayalam)`}
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:border-blue-500 focus:outline-none"
                            />
                          )}
                        </div>
                        {q.choices.length > 2 && (
                          <button
                            onClick={() => removeChoice(qIdx, cIdx)}
                            className={`text-red-500 hover:text-red-700 text-sm px-2 ${hasMalayalam ? "self-start mt-1" : ""}`}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => addChoice(qIdx)}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      + Add choice
                    </button>
                  </div>
                ) : (
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
                )}
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
