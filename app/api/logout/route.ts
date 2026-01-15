import { NextResponse } from "next/server";
import { logActivity } from "@/app/lib/sheets";

export async function POST(req: Request) {
  try {
    const { username } = await req.json();
    
    // Log Activity
    if (username) {
        const userAgent = req.headers.get("user-agent");
        logActivity(username, "LOGOUT", userAgent).catch(console.error);
    }

    const res = NextResponse.json({ ok: true });

    // Clear Auth Cookies
    const cookieOptions = {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        maxAge: 0,
    };

    res.cookies.set("invoicecraft_auth", "", cookieOptions);
    res.cookies.set("invoicecraft_role", "", cookieOptions);

    return res;
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
