import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (
    !session?.user?.id ||
    (session.user.role !== "admin" && session.user.role !== "quizmaster")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id: quizId } = await params;

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: { id: true, title: true },
  });
  if (!quiz) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  const attempts = await prisma.attempt.findMany({
    where: { quizId, isComplete: true, archivedAt: null },
    include: {
      user: { select: { email: true } },
    },
  });

  const emails = attempts.map((a) => a.user.email);

  return NextResponse.json({ quizId, quizTitle: quiz.title, count: emails.length, emails });
}
