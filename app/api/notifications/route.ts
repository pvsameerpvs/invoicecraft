import { NextResponse } from "next/server";
import { getSheetsClient } from "@/app/lib/sheets";
import { getSubdomainFromRequest, getTenantSheetId } from "@/lib/user.id";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const subdomain = getSubdomainFromRequest(req);
        const SHEET_ID = await getTenantSheetId(subdomain);
        if (!SHEET_ID) {
            return NextResponse.json({ ok: false, error: "Sheet ID not found" }, { status: 404 });
        }

        const sheets = getSheetsClient();
        
        // Fetch both Invoices and Quotations
        const [invoiceRes, quotationRes] = await Promise.all([
            sheets.spreadsheets.values.get({
                spreadsheetId: SHEET_ID,
                range: "Invoices!A:P",
            }),
            sheets.spreadsheets.values.get({
                spreadsheetId: SHEET_ID,
                range: "Quotations!A:P",
            })
        ]);

        const invoiceRows = (invoiceRes.data.values || []).slice(1);
        const quotationRows = (quotationRes.data.values || []).slice(1);
        
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const notifications: any[] = [];

        // 1. Check Overdue Invoices
        invoiceRows.forEach(row => {
            const invoiceNumber = row[1];
            const dateStr = row[2];
            const clientName = row[3];
            const total = row[8];
            const statusRaw = row[11];
            let status = statusRaw || "Unpaid";
            if (status === 'Pending') status = 'Unpaid';

            if (status !== 'Paid' && status !== 'Overdue') {
                const invoiceDate = new Date(dateStr);
                if (!isNaN(invoiceDate.getTime())) {
                    const diffTime = now.getTime() - invoiceDate.getTime();
                    const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));
                    if (diffDays > 30) {
                        notifications.push({
                            id: `inv-overdue-${invoiceNumber}`,
                            type: 'overdue_invoice',
                            title: `Invoice ${invoiceNumber} Overdue`,
                            message: `${clientName}'s invoice for ${total} is overdue by ${diffDays} days.`,
                            date: dateStr,
                            link: `/invoice/edit/${invoiceNumber}`,
                            priority: 'high'
                        });
                    }
                }
            } else if (status === 'Overdue') {
                 notifications.push({
                    id: `inv-overdue-${invoiceNumber}`,
                    type: 'overdue_invoice',
                    title: `Invoice ${invoiceNumber} Overdue`,
                    message: `${clientName}'s invoice for ${total} is marked as overdue.`,
                    date: dateStr,
                    link: `/invoice/edit/${invoiceNumber}`,
                    priority: 'high'
                });
            }
        });

        // 2. Check Quotations Expiring Soon
        quotationRows.forEach(row => {
            const qtnNumber = row[1];
            const clientName = row[3];
            const statusRaw = row[11];
            const validityDateStr = row[15]; // Column P

            if (statusRaw !== 'Accepted' && validityDateStr) {
                const validityDate = new Date(validityDateStr);
                if (!isNaN(validityDate.getTime())) {
                    const diffTime = validityDate.getTime() - now.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));

                    if (diffDays <= 10 && diffDays >= 0) {
                        let msg = `Quotation for ${clientName} expires in ${diffDays} days.`;
                        if (diffDays === 0) msg = `Quotation for ${clientName} expires today!`;
                        if (diffDays === 1) msg = `Quotation for ${clientName} expires tomorrow.`;

                        notifications.push({
                            id: `qtn-expiring-${qtnNumber}`,
                            type: 'expiring_quotation',
                            title: `Quotation ${qtnNumber} Expiring Soon`,
                            message: msg,
                            date: validityDateStr,
                            link: `/invoice/edit/${qtnNumber}?type=Quotation`,
                            priority: diffDays <= 3 ? 'high' : 'medium'
                        });
                    } else if (diffDays < 0) {
                         notifications.push({
                            id: `qtn-expired-${qtnNumber}`,
                            type: 'expired_quotation',
                            title: `Quotation ${qtnNumber} Expired`,
                            message: `Quotation for ${clientName} has expired.`,
                            date: validityDateStr,
                            link: `/invoice/edit/${qtnNumber}?type=Quotation`,
                            priority: 'low'
                        });
                    }
                }
            }
        });

        // Sort notifications by priority (high -> medium -> low)
        const priorityScore: any = { high: 3, medium: 2, low: 1 };
        notifications.sort((a, b) => priorityScore[b.priority] - priorityScore[a.priority]);

        return NextResponse.json(notifications);

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
