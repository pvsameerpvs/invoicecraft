import { NextResponse } from "next/server";
import { getSheetsClient } from "../../../lib/sheets";
import { getTenantSheetId } from "@/lib/user.id";

export const dynamic = 'force-dynamic';
export const runtime = "nodejs"; // Needed for googleapis

export async function GET() {
    try {
        const SHEET_ID = await getTenantSheetId("coducer");
           if (!SHEET_ID) {
             return NextResponse.json(
               { ok: false, error: "Sheet ID not found" },
               { status: 404 }
             );
           }

        const sheets = getSheetsClient();
        
        // 1. Fetch current data to identify rows
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: "Invoices!A:L", // Assuming L is Status
        });

        const rows = res.data.values || [];
        if (rows.length < 2) return NextResponse.json({ updated: 0, message: "No data" });

        const now = new Date();
        const updates: any[] = [];
        
        // Skip header (row 0), start from row 1 (which is sheet row 2)
        rows.forEach((row, index) => {
            if (index === 0) return; // Header

            const dateStr = row[2]; // Column C: Date
            const status = row[11] || "Unpaid"; // Column L: Status

            const invoiceDate = new Date(dateStr);
            if (isNaN(invoiceDate.getTime())) return;

            // Check if older than 30 days and NOT Paid and NOT already Overdue
            const diffTime = now.getTime() - invoiceDate.getTime();
            const diffDays = diffTime / (1000 * 3600 * 24);

            if (diffDays > 30 && status !== 'Paid' && status !== 'Overdue') {
                // Prepare Update for this row
                // Sheet Row Number = index + 1
                // Update Column L (Status) -> "Overdue"
                updates.push({
                    range: `Invoices!L${index + 1}`,
                    values: [["Overdue"]]
                });
            }
        });

        if (updates.length > 0) {
            // Batch Update
            await sheets.spreadsheets.values.batchUpdate({
                spreadsheetId: SHEET_ID,
                requestBody: {
                    valueInputOption: "RAW",
                    data: updates
                }
            });
        }

        return NextResponse.json({ updated: updates.length, message: "Success" });

    } catch (e: any) {
        console.error("Cron Update Error", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
