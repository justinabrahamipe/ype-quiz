import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AnswerType } from "@prisma/client";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const { title, biblePortion, startDate, questionCount, questions } = body;

  if (!title || !biblePortion || !startDate || !questionCount || !questions?.length) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Start time: 12:00 noon on chosen date
  const start = new Date(startDate);
  start.setHours(12, 0, 0, 0);

  // End time: 23:59 the next day
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  end.setHours(23, 59, 0, 0);

  const quiz = await prisma.quiz.create({
    data: {
      title,
      biblePortion,
      startTime: start,
      endTime: end,
      questionCount,
      createdBy: session.user.id,
      questions: {
        create: questions.map(
          (
            q: {
              questionText: string;
              answerType: string;
              acceptedAnswers: string[];
            },
            i: number
          ) => ({
            questionText: q.questionText,
            answerType: q.answerType as AnswerType,
            acceptedAnswers: q.acceptedAnswers,
            orderIndex: i,
          })
        ),
      },
    },
    include: { questions: true },
  });

  return NextResponse.json({ id: quiz.id, created: true });
}
