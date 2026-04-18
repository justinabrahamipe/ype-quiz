import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName:
      process.env.NODE_ENV === "production"
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
  });

  // Protect admin routes
  if (pathname.startsWith("/admin")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (token.role !== "admin" && token.role !== "quizmaster") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    // Quizmasters can access quiz-related admin pages but not user management
    if (token.role === "quizmaster" && pathname === "/admin/users") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
  }

  // Protect quiz routes
  if (pathname.startsWith("/quiz")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/quiz/:path*"],
};
