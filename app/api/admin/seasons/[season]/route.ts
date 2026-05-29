import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ season: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { season: seasonParam } = await params;
  const season = parseInt(seasonParam, 10);
  if (!Number.isInteger(season) || season < 1) {
    return NextResponse.json({ error: "Invalid season" }, { status: 400 });
  }

  const { name } = await req.json();
  const trimmed = typeof name === "string" ? name.trim() : "";
  if (!trimmed) {
    // Empty name = remove custom label (fall back to "Season N")
    await prisma.seasonLabel.deleteMany({ where: { season } });
    return NextResponse.json({ ok: true, name: null });
  }

  await prisma.seasonLabel.upsert({
    where: { season },
    update: { name: trimmed },
    create: { season, name: trimmed },
  });
  return NextResponse.json({ ok: true, name: trimmed });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ season: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { season: seasonParam } = await params;
  const season = parseInt(seasonParam, 10);
  if (!Number.isInteger(season) || season < 1) {
    return NextResponse.json({ error: "Invalid season" }, { status: 400 });
  }

  const settings = await prisma.appSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });

  if (season === 1 && settings.currentSeason === 1) {
    return NextResponse.json(
      { error: "Cannot delete the only remaining season." },
      { status: 400 }
    );
  }

  // Find all quizzes in this season
  const quizzes = await prisma.quiz.findMany({
    where: { season },
    select: { id: true },
  });

  // Always roll back currentSeason before returning, even if there are no quizzes
  if (season === settings.currentSeason) {
    await prisma.appSettings.update({
      where: { id: 1 },
      data: { currentSeason: Math.max(1, season - 1) },
    });
  }

  if (quizzes.length === 0) {
    return NextResponse.json({ deleted: 0 });
  }

  const quizIds = quizzes.map((q) => q.id);

  // Find all attempts for these quizzes to cascade-delete answers
  const attempts = await prisma.attempt.findMany({
    where: { quizId: { in: quizIds } },
    select: { id: true },
  });
  const attemptIds = attempts.map((a) => a.id);

  // Cascade: answers → attempts → questions → quizzes
  if (attemptIds.length > 0) {
    await prisma.answer.deleteMany({ where: { attemptId: { in: attemptIds } } });
  }
  await prisma.attempt.deleteMany({ where: { quizId: { in: quizIds } } });
  await prisma.question.deleteMany({ where: { quizId: { in: quizIds } } });
  await prisma.quiz.deleteMany({ where: { id: { in: quizIds } } });

  return NextResponse.json({ deleted: quizIds.length });
}
