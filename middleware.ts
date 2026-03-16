import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Protect admin routes
  if (pathname.startsWith("/admin")) {
    if (!req.auth?.user) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (req.auth.user.role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Protect quiz routes
  if (pathname.startsWith("/quiz")) {
    if (!req.auth?.user) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/quiz/:path*"],
};
