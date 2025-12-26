import { NextResponse } from "next/server";
import { logActivity } from "../../lib/sheets";

export async function POST(req: Request) {
  try {
    const { username } = await req.json();
    
    // Log Activity
    if (username) {
        const userAgent = req.headers.get("user-agent");
        logActivity(username, "LOGOUT", userAgent).catch(console.error);
    }

    const res = NextResponse.json({ ok: true });

    // Clear Auth Cookie
    res.cookies.set("js_auth", "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0, 
    });

    return res;
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
