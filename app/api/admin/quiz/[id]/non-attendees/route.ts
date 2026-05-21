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

  const attendedUserIds = await prisma.attempt.findMany({
    where: { quizId, archivedAt: null },
    select: { userId: true },
  });
  const attendedSet = new Set(attendedUserIds.map((a) => a.userId));

  const qualified = await prisma.user.findMany({
    where: {
      role: "user",
      isApproved: true,
      isQualified: true,
    },
    select: { id: true, name: true, email: true },
    orderBy: { createdAt: "asc" },
  });

  const nonAttendees = qualified.filter((u) => !attendedSet.has(u.id));

  return NextResponse.json({
    quizId,
    quizTitle: quiz.title,
    count: nonAttendees.length,
    members: nonAttendees.map((u) => ({ name: u.name, email: u.email })),
    emails: nonAttendees.map((u) => u.email),
  });
}
