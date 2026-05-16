import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { processQuizResults } from "@/lib/scoring";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "admin" && session.user.role !== "quizmaster")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id: quizId } = await params;
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  if (!quiz) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  await processQuizResults(quizId);
  return NextResponse.json({ reprocessed: true });
}
