import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const { username, password } = body;

  if ((username === "pooja" && password === "pooja@123") || (username === "admin" && password === "adminjs@321")) {
    const res = NextResponse.json({ ok: true });

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
