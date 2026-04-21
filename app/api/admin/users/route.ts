import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Role } from "@prisma/client";
import { getUsersAggregates } from "@/lib/aggregate-score";

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || "mahanaimype@gmail.com";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });
  const aggregates = await getUsersAggregates(users.map((u) => u.id));
  const withScore = users.map((u) => ({
    ...u,
    score: aggregates.get(u.id)?.totalScore ?? 0,
  }));

  // Sort: super admin first, then admins, then quizmasters, then users
  const roleOrder: Record<string, number> = { admin: 0, quizmaster: 1, user: 2 };
  const sorted = [...withScore].sort((a, b) => {
    if (a.email === SUPER_ADMIN_EMAIL) return -1;
    if (b.email === SUPER_ADMIN_EMAIL) return 1;
    const ra = roleOrder[a.role] ?? 2;
    const rb = roleOrder[b.role] ?? 2;
    return ra - rb;
  });

  return NextResponse.json(sorted);
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { user_id, action } = body;

  if (!user_id) {
    return NextResponse.json({ error: "user_id required" }, { status: 400 });
  }

  const targetUser = await prisma.user.findUnique({ where: { id: user_id } });
  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Toggle role
  if (action === "toggle_role" || body.role) {
    const role = body.role || (targetUser.role === "admin" ? "user" : "admin");
    if (!["admin", "user", "quizmaster"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    if (targetUser.email === SUPER_ADMIN_EMAIL) {
      return NextResponse.json({ error: "Cannot change super admin role" }, { status: 403 });
    }
    if (targetUser.id === session.user.id) {
      return NextResponse.json({ error: "Cannot change your own role" }, { status: 403 });
    }
    await prisma.user.update({
      where: { id: user_id },
      data: { role: role as Role },
    });
    return NextResponse.json({ updated: true, field: "role" });
  }

  // Toggle qualification
  if (action === "toggle_qualified") {
    await prisma.user.update({
      where: { id: user_id },
      data: { isQualified: !targetUser.isQualified },
    });
    return NextResponse.json({ updated: true, field: "isQualified", value: !targetUser.isQualified });
  }

  // Approve a pending user
  if (action === "approve") {
    await prisma.user.update({
      where: { id: user_id },
      data: { isApproved: true },
    });
    return NextResponse.json({ updated: true, field: "isApproved", value: true });
  }

  // Revoke approval (put a user back into pending)
  if (action === "revoke_approval") {
    if (targetUser.email === SUPER_ADMIN_EMAIL) {
      return NextResponse.json({ error: "Cannot revoke super admin" }, { status: 403 });
    }
    await prisma.user.update({
      where: { id: user_id },
      data: { isApproved: false },
    });
    return NextResponse.json({ updated: true, field: "isApproved", value: false });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("PATCH /api/admin/users error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { user_id } = await req.json();
  if (!user_id) {
    return NextResponse.json({ error: "user_id required" }, { status: 400 });
  }

  const targetUser = await prisma.user.findUnique({ where: { id: user_id } });
  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (targetUser.email === SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: "Cannot delete super admin" }, { status: 403 });
  }

  // Delete in order: answers, attempts, overallScore, then user
  await prisma.answer.deleteMany({ where: { attempt: { userId: user_id } } });
  await prisma.attempt.deleteMany({ where: { userId: user_id } });
  await prisma.overallScore.deleteMany({ where: { userId: user_id } });
  await prisma.user.delete({ where: { id: user_id } });

  return NextResponse.json({ deleted: true });
}
