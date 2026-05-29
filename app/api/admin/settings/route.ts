import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function getSettings() {
  return prisma.appSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });
}

export async function GET() {
  const session = await auth();
  if (
    !session?.user?.id ||
    (session.user.role !== "admin" && session.user.role !== "quizmaster")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const body = await req.json();
  const { openSignup, currentSeason } = body;

  const updateData: Record<string, unknown> = {};
  if (typeof openSignup === "boolean") updateData.openSignup = openSignup;
  if (Number.isInteger(currentSeason) && currentSeason >= 1) updateData.currentSeason = currentSeason;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const settings = await prisma.appSettings.upsert({
    where: { id: 1 },
    update: updateData,
    create: { id: 1, ...updateData },
  });
  return NextResponse.json(settings);
}
