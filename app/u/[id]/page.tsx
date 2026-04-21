import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getOverallRank } from "@/lib/rank";
import { getUserAggregate } from "@/lib/aggregate-score";
import { UserShareView } from "./user-share-view";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

async function getUserStanding(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      image: true,
      isApproved: true,
      isQualified: true,
      role: true,
    },
  });
  if (!user || !user.isApproved || user.role !== "user") return null;

  const aggregate = await getUserAggregate(id);
  const onBoard =
    aggregate.totalScore > 0 ||
    aggregate.quizzesAttempted > 0 ||
    aggregate.quizzesMissed > 0;
  const { rank, totalMembers } = await getOverallRank(
    aggregate.totalScore,
    onBoard
  );

  return {
    name: user.name || "Anonymous",
    image: user.image,
    score: aggregate.totalScore,
    rank,
    totalMembers,
    quizzesAttempted: aggregate.quizzesAttempted,
  };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  try {
    const { id } = await params;
    const data = await getUserStanding(id);
    if (!data) return { title: "YPE Bible Quiz" };

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://www.mahanaimypequiz.com";
    const rankLabel =
      data.rank === 1
        ? "1st"
        : data.rank === 2
        ? "2nd"
        : data.rank === 3
        ? "3rd"
        : data.rank > 0
        ? `#${data.rank}`
        : "";
    const title = `${data.name} · YPE Bible Quiz`;
    const description = data.rank > 0
      ? `${data.name} is ranked ${rankLabel} of ${data.totalMembers} · ${data.score} pts · ${data.quizzesAttempted} ${data.quizzesAttempted === 1 ? "quiz" : "quizzes"} taken.`
      : `${data.name} on the YPE Bible Quiz — Young People's Endeavour, Mahanaim Church of God.`;
    const pageUrl = `${siteUrl}/u/${id}`;

    return {
      title,
      description,
      alternates: { canonical: pageUrl },
      openGraph: {
        type: "profile",
        url: pageUrl,
        siteName: "YPE Bible Quiz",
        title,
        description,
      },
      twitter: { card: "summary_large_image", title, description },
      robots: { index: true, follow: true },
    };
  } catch (err) {
    console.error("[u/id] metadata error:", err);
    return { title: "YPE Bible Quiz" };
  }
}

export default async function UserSharePage({ params }: Params) {
  const { id } = await params;
  const data = await getUserStanding(id);
  if (!data) notFound();

  return (
    <UserShareView
      name={data.name}
      image={data.image}
      rank={data.rank}
      totalMembers={data.totalMembers}
      score={data.score}
      quizzesAttempted={data.quizzesAttempted}
    />
  );
}
