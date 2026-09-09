import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Next.js 16: file `middleware.ts` -> `proxy.ts`, fungsi `middleware` -> `proxy`.
// Role guard: setiap request ke (admin)/* atau (kader)/* dicek session + role di sini
// (defense in depth) — Server Action tetap scope query berdasarkan session.userId sendiri.
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  const isAuthPage = pathname === "/login";
  const isAdminArea = pathname.startsWith("/admin");
  const isKaderArea = pathname.startsWith("/kader");

  if (isAuthPage) {
    if (isLoggedIn) {
      const dest = role === "ADMIN" ? "/admin/dashboard" : "/kader/dashboard";
      return NextResponse.redirect(new URL(dest, req.url));
    }
    return;
  }

  if (isAdminArea || isKaderArea) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (isAdminArea && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/kader/dashboard", req.url));
    }
    if (isKaderArea && role !== "KADER") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
  }
});

export const config = {
  matcher: ["/admin/:path*", "/kader/:path*", "/login"],
};
