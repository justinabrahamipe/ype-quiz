import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Role } from "@prisma/client";

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || "mahanaimype@gmail.com";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    include: { overallScore: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { user_id, role } = await req.json();

  if (!user_id || !["admin", "user"].includes(role)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // Cannot demote super admin
  const targetUser = await prisma.user.findUnique({ where: { id: user_id } });
  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (targetUser.email === SUPER_ADMIN_EMAIL && role === "user") {
    return NextResponse.json({ error: "Cannot demote super admin" }, { status: 403 });
  }

  await prisma.user.update({
    where: { id: user_id },
    data: { role: role as Role },
  });

  return NextResponse.json({ updated: true });
}
