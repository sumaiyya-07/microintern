import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "@/lib/auth/jwt";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("microintern-token")?.value;
  const path = request.nextUrl.pathname;

  const isCandidateRoute = path.startsWith("/candidate");
  const isCompanyRoute = path.startsWith("/company");
  const isAdminRoute = path.startsWith("/admin") && path !== "/admin/login";

  if (isCandidateRoute || isCompanyRoute || isAdminRoute) {
    if (!token) {
      if (isAdminRoute) {
        return NextResponse.redirect(new URL("/admin/login?error=session_expired", request.url));
      }
      return NextResponse.redirect(new URL("/login?error=session_expired", request.url));
    }

    const payload = await decrypt(token);
    if (!payload || payload.isActive === false) {
      const response = NextResponse.redirect(
        new URL(isAdminRoute ? "/admin/login?error=invalid" : "/login?error=invalid", request.url)
      );
      response.cookies.delete("microintern-token");
      return response;
    }

    // Role checks
    if (isCandidateRoute && payload.role !== "candidate") {
      return NextResponse.redirect(new URL("/login?error=unauthorized", request.url));
    }
    if (isCompanyRoute && payload.role !== "company") {
      return NextResponse.redirect(new URL("/login?error=unauthorized", request.url));
    }
    if (isAdminRoute && payload.role !== "admin") {
      return NextResponse.redirect(new URL("/admin/login?error=unauthorized", request.url));
    }
  }

  // Prevent logged-in users from visiting login/signup pages
  if ((path === "/login" || path === "/signup") && token) {
    const payload = await decrypt(token);
    if (payload && payload.isActive !== false) {
      if (payload.role === "candidate") {
        return NextResponse.redirect(new URL("/candidate/dashboard", request.url));
      }
      if (payload.role === "company") {
        return NextResponse.redirect(new URL("/company/dashboard", request.url));
      }
      if (payload.role === "admin") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/candidate/:path*",
    "/company/:path*",
    "/admin/:path*",
    "/login",
    "/signup",
  ],
};
