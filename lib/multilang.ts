export type BilingualQuestionInput = {
  answerType?: string;
  questionText?: string;
  questionTextMl?: string | null;
  choices?: string[];
  choicesMl?: string[];
  acceptedAnswers?: string[];
  acceptedAnswersMl?: string[];
};

// Validates a question payload against the bilingual contract.
// Bilingual quizzes only allow mcq + number; text is excluded because
// fuzzy Levenshtein matching on Malayalam strings is unreliable.
export function validateBilingualQuestion(q: BilingualQuestionInput): string | null {
  if (!q.questionText?.trim()) return "Missing English question text";
  if (q.answerType === "text") return "Bilingual quizzes can't use text questions";
  if (!q.questionTextMl || !q.questionTextMl.trim()) return "Missing Malayalam question text";

  if (q.answerType === "mcq") {
    const en = (q.choices ?? []).map((c) => (c ?? "").trim());
    const ml = (q.choicesMl ?? []).map((c) => (c ?? "").trim());
    const enFilled = en.filter((c) => c);
    const mlFilled = ml.filter((c) => c);
    if (enFilled.length < 2) return "MCQ needs at least 2 English choices";
    if (mlFilled.length !== enFilled.length) return "Malayalam choices must match the English choices count";
    if (!q.acceptedAnswers?.length) return "MCQ correct answer required";
    if (!q.acceptedAnswersMl?.length) return "Malayalam correct answer required";
  }

  return null;
}
