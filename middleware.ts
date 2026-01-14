import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/invoice") || pathname.startsWith("/dashboard") || pathname.startsWith("/history") || pathname.startsWith("/profile")) {
    const auth = req.cookies.get("invoicecraft_auth")?.value;

    if (!auth) {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/invoice/:path*", "/dashboard/:path*", "/history/:path*", "/profile/:path*"],
};
