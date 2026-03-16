import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { processQuizResults } from "@/lib/scoring";

export async function GET() {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const quizzes = await prisma.quiz.findMany({
    where: {
      endTime: { lte: now, gte: oneDayAgo },
      resultsProcessed: false,
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
