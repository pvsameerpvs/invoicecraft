import { NextResponse } from "next/server";
import { logActivity } from "@/app/lib/sheets";

export async function POST(req: Request) {
  const body = await req.json();
  const { username, password } = body;

  if ((username === "pooja" && password === "pooja@123") || (username === "admin" && password === "adminjs@321")) {
    const res = NextResponse.json({ ok: true });

    // ✅ Log Activity
    const userAgent = req.headers.get("user-agent");
    // Fire and forget logging to avoid slowing down login
    logActivity(username, "LOGIN", userAgent).catch(console.error);

    res.cookies.set("js_auth", "1", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });

    return res;
  }

  return NextResponse.json({ ok: false }, { status: 401 });
}
