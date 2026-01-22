import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { logActivity } from "../../lib/sheets";
import { verifyUser } from "@/app/lib/auth";
import { getTenantSheetId } from "@/lib/user.id";
import { getSubdomainFromRequest } from "@/lib/user.id";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    const subdomain = getSubdomainFromRequest(req);
    const sheetId = await getTenantSheetId(subdomain);
    console.log("sheetId", sheetId);

    const user = await verifyUser(username, password);


    if (user) {
      // Set Auth Cookie
      // Create the response object first
      const response = NextResponse.json({ ok: true, username: user.username, role: user.role });

      // Set Auth Cookie with robust options
      const cookieOptions = {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
      };
      
      // Sanitize username to ensure valid header value
      const safeUsername = user.username.trim();
      
      response.cookies.set("invoicecraft_auth", safeUsername, cookieOptions);
      response.cookies.set("invoicecraft_role", user.role, cookieOptions);

      // Log Activity
      try {
        await logActivity(safeUsername, "User Logged In", req.headers.get("user-agent"));
      } catch (e) {
        console.error("Failed to log activity", e);
      }

      return response;
    }

    return NextResponse.json(
      { ok: false, error: "Invalid username or password" },
      { status: 401 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Failed" },
      { status: 500 }
    );
  }
}
