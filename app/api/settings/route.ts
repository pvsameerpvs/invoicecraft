
import { NextResponse } from "next/server";
import { getSheetsClient } from "@/app/lib/sheets";

export const dynamic = 'force-dynamic';

// Same Sheet ID as used in other routes
const SHEET_ID = process.env.GOOGLE_SHEET_ID || "1oo7G79VtN-zIQzlpKzVHGKGDObWik7MUPdVA2ZrEayQ";

export async function GET() {
  try {
    const sheets = getSheetsClient();
    
    // Fetch Header (Row 1) and Data (Row 2)
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "Settings!A1:K2",
    });

    const rows = res.data.values || [];
    if (rows.length < 2) {
        // No settings found, return empty or defaults
        return NextResponse.json({}); 
    }

    const headers = rows[0];
    const values = rows[1];

    // Map headers to values
    const settings: Record<string, string> = {};
    headers.forEach((header, index) => {
        settings[header] = values[index] || "";
    });

    return NextResponse.json(settings);
  } catch (e: any) {
    console.error("Failed to fetch settings:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
