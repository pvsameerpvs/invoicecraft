import { NextResponse } from "next/server";
import { getSheetsClient } from "@/app/lib/sheets";
import { getSubdomainFromRequest, getTenantSheetId } from "@/lib/user.id";

export const dynamic = 'force-dynamic';

import { BUSINESS_PROFILES } from "@/lib/businessProfiles";

const PROFILE_SHEETS: Record<string, { sheet: string; headers: string[] }> = {
    "Product":   { 
        sheet: "Catalog_Product",   
        headers: [BUSINESS_PROFILES["Product"].fields.descLabel, BUSINESS_PROFILES["Product"].fields.priceLabel] 
    },
    "Service":   { 
        sheet: "Catalog_Service",   
        headers: [BUSINESS_PROFILES["Service"].fields.descLabel, BUSINESS_PROFILES["Service"].fields.priceLabel] 
    },
    "Hourly":    { 
        sheet: "Catalog_Hourly",    
        headers: [BUSINESS_PROFILES["Hourly"].fields.descLabel, BUSINESS_PROFILES["Hourly"].fields.priceLabel] 
    },
    "Project":   { 
        sheet: "Catalog_Project",   
        headers: [BUSINESS_PROFILES["Project"].fields.descLabel, BUSINESS_PROFILES["Project"].fields.priceLabel] 
    },
    "Recurring": { 
        sheet: "Catalog_Recurring", 
        headers: [BUSINESS_PROFILES["Recurring"].fields.descLabel, BUSINESS_PROFILES["Recurring"].fields.priceLabel] 
    }
};

async function ensureSheet(sheets: any, spreadsheetId: string, profile: string) {
    const config = PROFILE_SHEETS[profile] || PROFILE_SHEETS["Product"];
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const existing = meta.data.sheets?.map((s: any) => s.properties?.title) || [];
    
    if (!existing.includes(config.sheet)) {
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [{ addSheet: { properties: { title: config.sheet } } }]
            }
        });
    }

    // Always ensure headers are correct based on profile
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${config.sheet}!A1:B1`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [config.headers] }
    });
    
    return config.sheet;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const profile = searchParams.get("profile") || "Product";
    
    const subdomain = getSubdomainFromRequest(req);
    const SHEET_ID = await getTenantSheetId(subdomain);
    if (!SHEET_ID) return NextResponse.json({ error: "Sheet ID not found" }, { status: 404 });
    
    const sheets = getSheetsClient();
    const sheetName = await ensureSheet(sheets, SHEET_ID, profile);

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${sheetName}!A2:B`, 
    });

    const rows = res.data.values || [];
    const products = rows
        .map((r) => ({ 
            label: r[0] || "", 
            amount: r[1] || "",
            profile: profile
        }))
        .filter(p => p.label)
        .sort((a, b) => a.label.localeCompare(b.label));

    return NextResponse.json(products);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
    try {
        const { label, amount, profile } = await req.json();
        if (!label) return NextResponse.json({ error: "Label required" }, { status: 400 });
        
        const subdomain = getSubdomainFromRequest(req);
        const SHEET_ID = await getTenantSheetId(subdomain);
        if (!SHEET_ID) return NextResponse.json({ error: "Sheet ID not found" }, { status: 404 });
        
        const sheets = getSheetsClient();
        const sheetName = await ensureSheet(sheets, SHEET_ID, profile || "Product");
        
        await sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            range: `${sheetName}!A:B`,
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
        const { label, profile } = await req.json();
        if (!label) return NextResponse.json({ error: "Label required" }, { status: 400 });
        
        const subdomain = getSubdomainFromRequest(req);
        const SHEET_ID = await getTenantSheetId(subdomain);
        if (!SHEET_ID) return NextResponse.json({ error: "Sheet ID not found" }, { status: 404 });
        
        const config = PROFILE_SHEETS[profile] || PROFILE_SHEETS["Product"];
        const sheets = getSheetsClient();
        
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${config.sheet}!A:B`,
        });

        const rows = res.data.values || [];
        const header = rows[0];
        const newRows = [header, ...rows.slice(1).filter(r => r[0] !== label)];

        await sheets.spreadsheets.values.clear({
            spreadsheetId: SHEET_ID,
            range: `${config.sheet}!A:B`,
        });

        await sheets.spreadsheets.values.update({
            spreadsheetId: SHEET_ID,
            range: `${config.sheet}!A1`,
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
        const { originalLabel, newLabel, newAmount, profile } = await req.json();
        if (!originalLabel || !newLabel) return NextResponse.json({ error: "Label required" }, { status: 400 });
        
        const subdomain = getSubdomainFromRequest(req);
        const SHEET_ID = await getTenantSheetId(subdomain);
        if (!SHEET_ID) return NextResponse.json({ error: "Sheet ID not found" }, { status: 404 });
        
        const config = PROFILE_SHEETS[profile] || PROFILE_SHEETS["Product"];
        const sheets = getSheetsClient();
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${config.sheet}!A:B`,
        });

        const rows = res.data.values || [];
        let rowIndex = rows.findIndex((r) => (r[0] || "").toString().trim() === originalLabel.trim());

        if (rowIndex === -1) return NextResponse.json({ error: "Product not found" }, { status: 404 });

        await sheets.spreadsheets.values.update({
            spreadsheetId: SHEET_ID,
            range: `${config.sheet}!A${rowIndex + 1}:B${rowIndex + 1}`,
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values: [[newLabel, newAmount]]
            }
        });
        
        return NextResponse.json({ ok: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
