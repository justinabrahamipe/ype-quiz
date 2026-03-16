import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id: quizId } = await params;

  const disputes = await prisma.dispute.findMany({
    where: {
      answer: {
        attempt: { quizId },
      },
    },
    include: {
      user: { select: { name: true, email: true } },
      answer: {
        select: {
          submittedText: true,
          question: {
            select: { questionText: true, acceptedAnswers: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(disputes);
}
