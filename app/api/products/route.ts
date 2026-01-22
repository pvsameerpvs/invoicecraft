import { NextResponse } from "next/server";
import { getSheetsClient } from "@/app/lib/sheets";
import { getSubdomainFromRequest, getTenantSheetId } from "@/lib/user.id";

export const dynamic = 'force-dynamic';



export async function GET(req: Request) {
  try {
         const subdomain = getSubdomainFromRequest(req);
    const SHEET_ID = await getTenantSheetId(subdomain);
    if (!SHEET_ID) {
    return NextResponse.json(
      { ok: false, error: "Sheet ID not found" },
      { status: 404 }
    );
    }
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
             const subdomain = getSubdomainFromRequest(req);
  const SHEET_ID = await getTenantSheetId(subdomain);
  if (!SHEET_ID) {
  return NextResponse.json(
    { ok: false, error: "Sheet ID not found" },
    { status: 404 }
  );
  }
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
             const subdomain = getSubdomainFromRequest(req);
  const SHEET_ID = await getTenantSheetId(subdomain);
  if (!SHEET_ID) {
  return NextResponse.json(
    { ok: false, error: "Sheet ID not found" },
    { status: 404 }
  );
  }
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

export async function PUT(req: Request) {
    try {
        const { originalLabel, newLabel, newAmount } = await req.json();
        console.log("PUT /api/products", { originalLabel, newLabel, newAmount });

        if (!originalLabel || !newLabel) return NextResponse.json({ error: "Label required" }, { status: 400 });
             const subdomain = getSubdomainFromRequest(req);
  const SHEET_ID = await getTenantSheetId(subdomain);
  if (!SHEET_ID) {
  return NextResponse.json(
    { ok: false, error: "Sheet ID not found" },
    { status: 404 }
  );
  }
        const sheets = getSheetsClient();
        
        // 1. Fetch all rows
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: "Products!A:B",
        });

        const rows = res.data.values || [];
        console.log(`Found ${rows.length} rows in sheet`);

        // Find exact match first, then try trim match
        let rowIndex = rows.findIndex((r) => r[0] === originalLabel);
        
        if (rowIndex === -1) {
            console.log("Exact match not found. Trying trimmed match...");
            rowIndex = rows.findIndex((r) => (r[0] || "").toString().trim() === originalLabel.trim());
        }

        if (rowIndex === -1) {
             console.error("Product not found in sheet:", originalLabel);
             return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        console.log(`Found product at row index ${rowIndex} (Sheet Row ${rowIndex + 1})`);

        // 2. Update the row
        // rowIndex is 0-based index of the array.
        // Sheet row number is rowIndex + 1
        
        await sheets.spreadsheets.values.update({
            spreadsheetId: SHEET_ID,
            range: `Products!A${rowIndex + 1}:B${rowIndex + 1}`,
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values: [[newLabel, newAmount]]
            }
        });
        
        console.log("Product updated successfully");

        return NextResponse.json({ ok: true });
    } catch (e: any) {
        console.error("PUT Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
