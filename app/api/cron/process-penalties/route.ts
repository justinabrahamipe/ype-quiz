import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { processPenalties } from "@/lib/scoring";

export async function GET() {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const quizzes = await prisma.quiz.findMany({
    where: {
      resultsProcessed: true,
      penaltyProcessed: false,
      endTime: { lte: now, gte: oneDayAgo },
    },
  });

  for (const quiz of quizzes) {
    await processPenalties(quiz.id);
  }

  return NextResponse.json({
    processed: quizzes.length,
    quizIds: quizzes.map((q) => q.id),
  });
}
