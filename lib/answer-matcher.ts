import { distance } from "fastest-levenshtein";

function normalise(str: string): string {
  let s = str.toLowerCase().trim();
  s = s.replace(/^(a |an |the )/i, "");
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

function levenshteinSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - distance(a, b) / maxLen;
}

export function isCorrect(
  submitted: string,
  acceptedAnswers: string[],
  type: "text" | "number" | "mcq"
): boolean {
  if (!submitted || submitted.trim() === "") return false;

  if (type === "number") {
    return acceptedAnswers.some((a) => submitted.trim() === a.trim());
  }

  if (type === "mcq") {
    const normSubmitted = normalise(submitted);
    return acceptedAnswers.some((a) => normalise(a) === normSubmitted);
  }

  const normSubmitted = normalise(submitted);
  return acceptedAnswers.some((accepted) => {
    const normAccepted = normalise(accepted);
    const similarity = levenshteinSimilarity(normSubmitted, normAccepted);
    return similarity >= 0.7;
  });
}
