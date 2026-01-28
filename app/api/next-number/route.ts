import { NextResponse } from "next/server";
import { getSheetsClient } from "@/app/lib/sheets";
import { getSubdomainFromRequest, getTenantSheetId } from "@/lib/user.id";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "Invoice";
    const subdomain = getSubdomainFromRequest(req);
    const SHEET_ID = await getTenantSheetId(subdomain);
    
    if (!SHEET_ID) {
      return NextResponse.json({ error: "Sheet ID not found" }, { status: 404 });
    }

    const sheets = getSheetsClient();
    const mainSheet = type === "Quotation" ? "Quotations" : "Invoices";
    const prefix = type === "Quotation" ? "QTN" : "INV";
    const currentYear = new Date().getFullYear();

    // Fetch only the ID column to find the latest
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${mainSheet}!B:B`,
    });

    const values = res.data.values || [];
    const numbers = values.slice(1).flat() as string[]; // Skip header

    let nextNum = `${prefix}-${currentYear}-000001`;

    if (numbers.length > 0) {
      // Filter for current year and correct prefix, then find the highest sequence
      const regex = new RegExp(`^${prefix}-${currentYear}-(\\d+)$`);
      const sequences = numbers
        .map(n => {
          const match = n.match(regex);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter(seq => seq > 0);

      if (sequences.length > 0) {
        const maxSeq = Math.max(...sequences);
        nextNum = `${prefix}-${currentYear}-${String(maxSeq + 1).padStart(6, "0")}`;
      }
    }

    return NextResponse.json({ nextNumber: nextNum });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
