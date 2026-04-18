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
  const { openSignup } = body;
  if (typeof openSignup !== "boolean") {
    return NextResponse.json({ error: "openSignup must be boolean" }, { status: 400 });
  }
  const settings = await prisma.appSettings.upsert({
    where: { id: 1 },
    update: { openSignup },
    create: { id: 1, openSignup },
  });
  return NextResponse.json(settings);
}
