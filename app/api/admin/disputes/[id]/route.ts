import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateOverallScore } from "@/lib/scoring";
import { DisputeStatus } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id: disputeId } = await params;
  const { status, admin_note } = await req.json();

  if (!["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: { answer: { include: { attempt: true } } },
  });

  if (!dispute) {
    return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
  }

  await prisma.dispute.update({
    where: { id: disputeId },
    data: {
      status: status as DisputeStatus,
      adminNote: admin_note || null,
      resolvedById: session.user.id,
      resolvedAt: new Date(),
    },
  });

  if (status === "approved") {
    // Flip is_correct to true
    await prisma.answer.update({
      where: { id: dispute.answerId },
      data: { isCorrect: true },
    });

    // Recalculate raw_score for the attempt
    const correctCount = await prisma.answer.count({
      where: { attemptId: dispute.answer.attemptId, isCorrect: true },
    });

    await prisma.attempt.update({
      where: { id: dispute.answer.attemptId },
      data: { rawScore: correctCount },
    });

    // Re-check bonus eligibility for the quiz
    const quiz = await prisma.quiz.findUnique({
      where: { id: dispute.answer.attempt.quizId },
    });

    if (quiz) {
      const sortedAttempts = await prisma.attempt.findMany({
        where: { quizId: quiz.id, isComplete: true },
        orderBy: { completedAt: "asc" },
      });

      let bonusCount = 0;
      for (const attempt of sortedAttempts) {
        const score = Number(attempt.rawScore ?? 0);
        if (score / quiz.questionCount >= 0.5 && bonusCount < 3) {
          await prisma.attempt.update({
            where: { id: attempt.id },
            data: { bonusPoints: 0.5 },
          });
          bonusCount++;
        } else {
          await prisma.attempt.update({
            where: { id: attempt.id },
            data: { bonusPoints: 0 },
          });
        }
      }
    }

    // Update overall score
    await updateOverallScore(dispute.answer.attempt.userId);
  }

  return NextResponse.json({ updated: true });
}
