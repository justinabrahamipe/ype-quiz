import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: quizId } = await params;

  const attempt = await prisma.attempt.findUnique({
    where: { quizId_userId: { quizId, userId: session.user.id } },
  });

  if (!attempt) {
    return NextResponse.json({ error: "No attempt found" }, { status: 404 });
  }

  if (attempt.isComplete) {
    return NextResponse.json({ error: "Already completed" }, { status: 400 });
  }

  await prisma.attempt.update({
    where: { id: attempt.id },
    data: { isComplete: true, completedAt: new Date() },
  });

  return NextResponse.json({ submitted: true });
}
