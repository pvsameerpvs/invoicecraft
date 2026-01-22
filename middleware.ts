import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // 1. Extract Subdomain from Host
  const hostname = req.headers.get("host") || "";
  let subdomain = "global"; 

  const hostNoPort = hostname.split(":")[0];
  const parts = hostNoPort.split(".");

  if (hostname.includes("localhost")) {
    // Localhost: tenant.localhost -> ["tenant", "localhost"]
    if (parts.length >= 2) {
      subdomain = parts[0];
    }
  } else {
    // Production: tenant.domain.com -> ["tenant", "domain", "com"]
    if (parts.length > 2) {
      subdomain = parts[0];
    }
  }

  // Normalize common main-site subdomains
  if (subdomain === "www" || subdomain === "app") {
    subdomain = "global";
  }

  // Pass subdomain to backend via headers
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-subdomain", subdomain);

  const auth = req.cookies.get("invoicecraft_auth")?.value;

  // 2. Protect Private Routes
  if (pathname.startsWith("/invoice") || pathname.startsWith("/dashboard") || pathname.startsWith("/history") || pathname.startsWith("/profile")) {
    if (!auth) {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  // 3. Redirect Logged-In Users away from Login Page
  if (pathname === "/" || pathname === "/login") {
    if (auth) {
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/", "/login", "/invoice/:path*", "/dashboard/:path*", "/history/:path*", "/profile/:path*"],
};
