import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("authToken")?.value;

  // Protected route definitions
  const isVendorRoute = pathname.startsWith("/vendor-dashboard");
  const isAdminRoute = pathname.startsWith("/admin-dashboard");

  if (isVendorRoute || isAdminRoute) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      loginUrl.searchParams.set("error", "auth_required");
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/vendor-dashboard/:path*",
    "/vendor-dashboard",
    "/admin-dashboard/:path*",
    "/admin-dashboard",
  ],
};
