import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { answer_id, comment } = await req.json();

  if (!answer_id || !comment?.trim()) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const answer = await prisma.answer.findUnique({
    where: { id: answer_id },
    include: { attempt: { include: { quiz: true } } },
  });

  if (!answer) {
    return NextResponse.json({ error: "Answer not found" }, { status: 404 });
  }

  // Only allow disputes after quiz window closes
  if (new Date() < answer.attempt.quiz.endTime) {
    return NextResponse.json({ error: "Quiz window still open" }, { status: 403 });
  }

  // Check for existing dispute
  const existing = await prisma.dispute.findUnique({
    where: { answerId: answer_id },
  });

  if (existing) {
    return NextResponse.json({ error: "Dispute already exists" }, { status: 400 });
  }

  await prisma.dispute.create({
    data: {
      answerId: answer_id,
      userId: session.user.id,
      comment: comment.trim(),
    },
  });

  return NextResponse.json({ created: true });
}
