import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const auth = req.cookies.get("invoicecraft_auth")?.value;

  // 1. Protect Private Routes
  if (pathname.startsWith("/invoice") || pathname.startsWith("/dashboard") || pathname.startsWith("/history") || pathname.startsWith("/profile")) {
    if (!auth) {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  // 2. Redirect Logged-In Users away from Login Page
  if (pathname === "/" || pathname === "/login") {
    if (auth) {
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/invoice/:path*", "/dashboard/:path*", "/history/:path*", "/profile/:path*"],
};
