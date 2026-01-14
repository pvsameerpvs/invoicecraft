import { NextResponse } from "next/server";
import { getSheetsClient } from "@/app/lib/sheets";

// SHARED CONSTANTS
// SHARED CONSTANTS
const SHEET_ID = "1oo7G79VtN-zIQzlpKzVHGKGDObWik7MUPdVA2ZrEayQ";

export const dynamic = 'force-dynamic';
export const runtime = "nodejs";

export async function GET() {
  try {
    const sheets = getSheetsClient();

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "Activity!A:D", // Columns: Timestamp, Username, Action, Device
    });

    const rows = res.data.values || [];
   
    // Map rows to objects
    // Assuming Row 1 might be header, but we just logging append...
    // Let's just return raw rows or map them if we want structure
    // If we simply appended, there might not be a header row or there might be one.
    // Let's assume raw data for now and handle styling in frontend.
    
    // Reverse to show newest first
    const logs = rows.map(r => ({
        timestamp: r[0] || "",
        username: r[1] || "",
        action: r[2] || "",
        userAgent: r[3] || ""
    })).reverse();

    return NextResponse.json(logs);
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Failed to fetch activity" },
      { status: 500 }
    );
  }
}
