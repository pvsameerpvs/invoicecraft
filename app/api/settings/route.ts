import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSheetsClient, logActivity } from "@/app/lib/sheets";

export const dynamic = 'force-dynamic';

// Same Sheet ID as used in other routes
const SHEET_ID = process.env.GOOGLE_SHEET_ID || "1oo7G79VtN-zIQzlpKzVHGKGDObWik7MUPdVA2ZrEayQ";

export async function GET() {
  try {
    const sheets = getSheetsClient();
    
    // Fetch Header (Row 1) and Data (Row 2)
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "Settings!A1:O2", // Expanded to O
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

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const sheets = getSheetsClient();
        const username = cookies().get("invoicecraft_auth")?.value || "Unknown";
        
        // We know the columns: 
        // A: CompanyName, B: CompanyAddress, C: BankCompanyName, D: BankName, E: BankLabel
        // F: AccountNumber, G: AccountIban, H: FooterNote, I: SignatureLabel, J: Currency, K: CompanyTrn
        // L: Theme, M: LogoUrl, N: ShowCompanyName, O: NavbarTitle 

        const values = [
            body.CompanyName || "",
            body.CompanyAddress || "",
            body.BankCompanyName || "",
            body.BankName || "",
            body.BankLabel || "",
            body.AccountNumber || "",
            body.AccountIban || "",
            body.FooterNote || "",
            body.SignatureLabel || "",
            body.Currency || "",
            body.CompanyTrn || "",
            body.Theme || "orange", // Default theme
            body.LogoUrl || "",
            body.ShowCompanyName === true || body.ShowCompanyName === "true" ? "true" : "false",
            body.NavbarTitle || ""
        ];

        await sheets.spreadsheets.values.update({
            spreadsheetId: SHEET_ID,
            // Expanded to O column
            range: "Settings!A2:O2", 
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values: [values]
            }
        });

        // Log Activity
        const userAgent = req.headers.get("user-agent");
        logActivity(username, "UPDATED SETTINGS", userAgent).catch(console.error);

        return NextResponse.json({ ok: true });
    } catch (e: any) {
        console.error("Failed to update settings:", e);
        return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
    }
}
