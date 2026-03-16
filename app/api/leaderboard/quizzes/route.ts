import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const quizzes = await prisma.quiz.findMany({
    where: { resultsProcessed: true },
    orderBy: { endTime: "desc" },
    select: { id: true, title: true, endTime: true },
  });

  return NextResponse.json(
    quizzes.map((q) => ({
      id: q.id,
      title: `${q.title} (${q.endTime.toLocaleDateString("en-US", { month: "short", day: "numeric" })})`,
    }))
  );
}
