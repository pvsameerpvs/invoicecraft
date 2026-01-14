import { NextResponse } from "next/server";
import { getSheetsClient } from "@/app/lib/sheets";

export const dynamic = 'force-dynamic';

const SHEET_ID = "1oo7G79VtN-zIQzlpKzVHGKGDObWik7MUPdVA2ZrEayQ";

export async function GET() {
  try {
    const sheets = getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "Products!A2:B", // Skip header row
    });

    const rows = res.data.values || [];
    
    // Sort alphabetically by label
    const products = rows
        .map((r) => ({ label: r[0] || "", amount: r[1] || "" }))
        .filter(p => p.label)
        .sort((a, b) => a.label.localeCompare(b.label));

    return NextResponse.json(products);
  } catch (e: any) {
    console.error("Failed to fetch products:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
    try {
        const { label, amount } = await req.json();
        if (!label) return NextResponse.json({ error: "Label required" }, { status: 400 });

        const sheets = getSheetsClient();
        await sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            range: "Products!A:B",
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values: [[label, amount]]
            }
        });

        return NextResponse.json({ ok: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { label } = await req.json();
        if (!label) return NextResponse.json({ error: "Label required" }, { status: 400 });

        const sheets = getSheetsClient();
        
        // 1. Fetch all rows
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: "Products!A:B",
        });

        const rows = res.data.values || [];
        const header = rows[0]; // Preserve header
        
        // 2. Filter out the deleted item
        // Skip header in filter, then add it back
        const newRows = [header, ...rows.slice(1).filter(r => r[0] !== label)];

        // 3. Clear Sheet
        await sheets.spreadsheets.values.clear({
            spreadsheetId: SHEET_ID,
            range: "Products!A:B",
        });

        // 4. Write back new list
        await sheets.spreadsheets.values.update({
            spreadsheetId: SHEET_ID,
            range: "Products!A1",
            valueInputOption: "USER_ENTERED",
            requestBody: { values: newRows }
        });

        return NextResponse.json({ ok: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
