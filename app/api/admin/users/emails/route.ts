import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope") || "approved";

  const where: { role: "user"; isApproved?: boolean; isQualified?: boolean } = {
    role: "user",
  };
  if (scope === "approved") where.isApproved = true;
  if (scope === "qualified") {
    where.isApproved = true;
    where.isQualified = true;
  }

  const users = await prisma.user.findMany({
    where,
    select: { email: true, name: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    scope,
    count: users.length,
    emails: users.map((u) => u.email),
  });
}
