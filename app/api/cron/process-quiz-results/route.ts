import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { processQuizResults } from "@/lib/scoring";

export async function GET() {
  const now = new Date();

  // Process all ended quizzes that haven't been processed yet — no time window
  // so quizzes missed by previous runs are always caught.
  const quizzes = await prisma.quiz.findMany({
    where: {
      endTime: { lte: now },
      resultsProcessed: false,
      isDraft: false,
    },
  });

  for (const quiz of quizzes) {
    await processQuizResults(quiz.id);
  }

  return NextResponse.json({
    processed: quizzes.length,
    quizIds: quizzes.map((q) => q.id),
  });
}
