import { NextResponse } from "next/server";
import { getSheetsClient } from "@/app/lib/sheets";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sheetId = "1oo7G79VtN-zIQzlpKzVHGKGDObWik7MUPdVA2ZrEayQ";
    const sheets = getSheetsClient();

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Products!A2:B", // Skip header row
    });

    const rows = res.data.values || [];
    
    const products = rows.map((r) => ({
      label: r[0] || "",
      amount: r[1] || "",
    })).filter(p => p.label); // Filter out empty rows

    return NextResponse.json(products);
  } catch (e: any) {
    console.error("Failed to fetch products:", e);
    return NextResponse.json(
      { error: e.message || "Failed to fetch products" }, 
      { status: 500 }
    );
  }
}
