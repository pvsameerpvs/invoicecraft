import { NextResponse } from "next/server";
import { getSheetsClient } from "@/app/lib/sheets";
import { getSubdomainFromRequest, getTenantSheetId } from "@/lib/user.id";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const subdomain = getSubdomainFromRequest(req);
    const SHEET_ID = await getTenantSheetId(subdomain);
    
    if (!SHEET_ID) {
      return NextResponse.json({ error: "Sheet ID not found" }, { status: 404 });
    }

    const sheets = getSheetsClient();
    
    // Fetch both Invoices and Quotations to get all clients
    const [invRes, qtnRes] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: "Invoices!A:J",
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: "Quotations!A:J",
      })
    ]);

    const invRows = invRes.data.values || [];
    const qtnRows = qtnRes.data.values || [];
    
    const allRows = [...invRows.slice(1), ...qtnRows.slice(1)];
    
    // index 3 is clientName, index 9 is payloadJson
    const clientsMap = new Map<string, { name: string; address: string; email: string; phone: string }>();

    allRows.forEach(row => {
      const name = row[3];
      const payloadJson = row[9];
      
      if (name) {
        try {
          const payload = JSON.parse(payloadJson);
          const existing = clientsMap.get(name);
          // If not exists or if existing has empty fields, update with newer one
          if (!existing || (!existing.email && payload.invoiceToEmail) || (!existing.phone && payload.invoiceToPhone)) {
             clientsMap.set(name, {
                name,
                address: payload.invoiceToAddress || (existing?.address || ""),
                email: payload.invoiceToEmail || (existing?.email || ""),
                phone: payload.invoiceToPhone || (existing?.phone || "")
             });
          }
        } catch (e) {
          if (!clientsMap.has(name)) {
            clientsMap.set(name, { name, address: "", email: "", phone: "" });
          }
        }
      }
    });

    const clients = Array.from(clientsMap.values());
    return NextResponse.json(clients);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
