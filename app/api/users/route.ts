import { NextResponse } from "next/server";
import { getSheetsClient, logActivity } from "../../lib/sheets";
import { verifyUser } from "@/app/lib/auth";
import { cookies } from "next/headers";

const USERS_SHEET_ID = "1oo7G79VtN-zIQzlpKzVHGKGDObWik7MUPdVA2ZrEayQ";

// POST: Create a new user
export async function POST(req: Request) {
    try {
        // Security Check: Only admins can create users
        const role = cookies().get("invoicecraft_role")?.value;
        if (role !== "admin") {
            return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 403 });
        }

        const { username, password, role: newRole } = await req.json();

        if (!username || !password) {
             return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
        }

        const sheets = getSheetsClient();

        // Check if user exists
        const existing = await sheets.spreadsheets.values.get({
            spreadsheetId: USERS_SHEET_ID,
            range: "Users!B:B",
        });

        const users = (existing.data.values || []).flat();
        if (users.includes(username)) {
            return NextResponse.json({ ok: false, error: "Username already taken" }, { status: 409 });
        }

        // Add User
        // ID, Username, Password, Role, Email, Mobile
        const id = Date.now().toString(); 
        await sheets.spreadsheets.values.append({
            spreadsheetId: USERS_SHEET_ID,
            range: "Users!A:F",
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values: [[id, username, password, newRole, "", ""]] 
            }
        });

        // Log
        const currentUser = cookies().get("invoicecraft_auth")?.value || "admin";
        await logActivity(currentUser, `CREATED USER ${username}`, req.headers.get("user-agent"));

        return NextResponse.json({ ok: true });
    } catch (e: any) {
        return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
    }
}
