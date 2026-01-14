import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { logActivity } from "../../lib/sheets";
import { verifyUser } from "@/app/lib/auth";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    const user = await verifyUser(username, password);

    if (user) {
      // Set Auth Cookie
      const cookieOptions = {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 1 week
      };
      
      cookies().set("invoicecraft_auth", user.username, cookieOptions);
      cookies().set("invoicecraft_role", user.role, cookieOptions);

      // Log Activity
      try {
        await logActivity(user.username, "User Logged In", req.headers.get("user-agent"));
      } catch (e) {
        console.error("Failed to log activity", e);
      }

      // Return user role so frontend can store it
      return NextResponse.json({ ok: true, username: user.username, role: user.role });
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
