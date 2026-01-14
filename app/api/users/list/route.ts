
import { NextResponse } from "next/server";
import { getSheetsClient } from "@/app/lib/sheets";
import { cookies } from "next/headers";

const USERS_SHEET_ID = "1oo7G79VtN-zIQzlpKzVHGKGDObWik7MUPdVA2ZrEayQ";

export async function GET(req: Request) {
    try {
        // Security Check: Only admins can list users
        const role = cookies().get("invoicecraft_role")?.value;
        if (role !== "admin") {
            return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 403 });
        }

        const sheets = getSheetsClient();
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: USERS_SHEET_ID,
            range: "Users!A2:G", // A to G to include CreatedAt
        });

        const rows = res.data.values || [];
        
        const users = rows.map(row => ({
            id: row[0] || "",
            username: row[1] || "",
            // Don't send password
            role: row[3] || "user",
            email: row[4] || "",
            mobile: row[5] || "",
            createdAt: row[6] || ""
        }));

        return NextResponse.json({ ok: true, users });
    } catch (e: any) {
        return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
    }
}
