import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { QuizShareView } from "./quiz-share-view";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

async function getQuiz(id: string) {
  return prisma.quiz.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      biblePortion: true,
      questionCount: true,
      startTime: true,
      endTime: true,
      isPrerequisite: true,
    },
  });
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  try {
    const { id } = await params;
    const quiz = await getQuiz(id);
    if (!quiz) return { title: "YPE Bible Quiz" };

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://www.mahanaimypequiz.com";
    const title = `${quiz.title} · YPE Bible Quiz`;
    const description = `${quiz.biblePortion} · ${quiz.questionCount} questions. Take the weekly Bible quiz by YPE, Mahanaim Church of God, Manchester.`;
    const pageUrl = `${siteUrl}/q/${id}`;

    return {
      title,
      description,
      alternates: { canonical: pageUrl },
      openGraph: {
        type: "article",
        url: pageUrl,
        siteName: "YPE Bible Quiz",
        title,
        description,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
      robots: { index: true, follow: true },
    };
  } catch (err) {
    console.error("[q/id] metadata error:", err);
    return { title: "YPE Bible Quiz" };
  }
}

export default async function QuizSharePage({ params }: Params) {
  const { id } = await params;
  const quiz = await getQuiz(id);
  if (!quiz) notFound();

  const session = await auth();
  if (session?.user?.id) {
    redirect(`/quiz/${id}`);
  }

  const now = new Date();
  const isActive = now >= quiz.startTime && now <= quiz.endTime;
  const isClosed = now > quiz.endTime;

  const status = quiz.isPrerequisite
    ? { label: "Qualifying quiz", color: "warning" as const }
    : isActive
    ? { label: "Open now", color: "success" as const }
    : isClosed
    ? { label: "Closed", color: "default" as const }
    : { label: "Upcoming", color: "info" as const };

  return (
    <QuizShareView
      id={quiz.id}
      title={quiz.title}
      biblePortion={quiz.biblePortion}
      questionCount={quiz.questionCount}
      startTime={quiz.startTime.toISOString()}
      endTime={quiz.endTime.toISOString()}
      statusLabel={status.label}
      statusColor={status.color}
      isClosed={isClosed}
    />
  );
}
