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
        
        const actualNow = new Date(); // True current time for recent activity
        const now = new Date();       // 00:00:00 for date-based expiry logic
        now.setHours(0, 0, 0, 0);

        const notifications: any[] = [];

        // 1. Check Invoices
        invoiceRows.forEach(row => {
            const timestamp = row[0];
            const invoiceNumber = row[1];
            const dateStr = row[2];
            const clientName = row[3];
            const total = row[8];
            const statusRaw = row[11];
            let status = statusRaw || "Unpaid";
            if (status === 'Pending') status = 'Unpaid';

            // Logic: Recently Created (Last 24 hours)
            if (timestamp) {
                const createdDate = new Date(timestamp);
                if (!isNaN(createdDate.getTime())) {
                    const diffHours = (actualNow.getTime() - createdDate.getTime()) / (1000 * 3600);
                    if (diffHours >= 0 && diffHours <= 24) {
                        notifications.push({
                            id: `inv-new-${invoiceNumber}`,
                            type: 'new_document',
                            title: `New Invoice Created`,
                            message: `Invoice ${invoiceNumber} for ${clientName} has been generated.`,
                            date: timestamp,
                            link: `/invoice/edit/${invoiceNumber}`,
                            priority: 'medium'
                        });
                    }
                }
            }

            if (status !== 'Paid') {
                const invoiceDate = new Date(dateStr);
                if (!isNaN(invoiceDate.getTime())) {
                    const diffTime = now.getTime() - invoiceDate.getTime();
                    const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));
                    
                    if (diffDays > 30) {
                        // OVERDUE Case
                        notifications.push({
                            id: `inv-overdue-${invoiceNumber}`,
                            type: 'overdue_invoice',
                            title: `Invoice ${invoiceNumber} OVERDUE`,
                            message: `${clientName}'s payment of ${total} is overdue by ${diffDays - 30} days.`,
                            date: dateStr,
                            link: `/invoice/edit/${invoiceNumber}`,
                            priority: 'high'
                        });
                    } else if (diffDays >= 20 && diffDays <= 30) {
                        // DUE SOON Case (countdown to 30 days)
                        const daysLeft = 30 - diffDays;
                        let msg = `${clientName}'s invoice for ${total} is due in ${daysLeft} days.`;
                        if (daysLeft === 0) msg = `${clientName}'s invoice for ${total} is due TODAY!`;
                        if (daysLeft === 1) msg = `${clientName}'s invoice for ${total} is due tomorrow.`;

                        notifications.push({
                            id: `inv-soon-${invoiceNumber}`,
                            type: 'expiring_quotation', // Use clock icon
                            title: `Payment Due Soon: ${invoiceNumber}`,
                            message: msg,
                            date: dateStr,
                            link: `/invoice/edit/${invoiceNumber}`,
                            priority: daysLeft <= 3 ? 'high' : 'medium'
                        });
                    }
                }
            }
        });

        // 2. Check Quotations (Expiring soon, Recently Accepted, or Recently Created)
        quotationRows.forEach(row => {
            const qtnTimestamp = row[0];
            const qtnNumber = row[1];
            const clientName = row[3];
            const statusRaw = row[11];
            const validityDateStr = row[15]; // Column P

            // Logic: Recently Created (Last 24 hours)
            if (qtnTimestamp) {
                const createdDate = new Date(qtnTimestamp);
                if (!isNaN(createdDate.getTime())) {
                    const diffHours = (actualNow.getTime() - createdDate.getTime()) / (1000 * 3600);
                    if (diffHours >= 0 && diffHours <= 24) {
                        notifications.push({
                            id: `qtn-new-${qtnNumber}`,
                            type: 'new_document',
                            title: `New Quotation Created`,
                            message: `Quotation ${qtnNumber} for ${clientName} has been generated.`,
                            date: qtnTimestamp,
                            link: `/invoice/edit/${qtnNumber}?type=Quotation`,
                            priority: 'medium'
                        });
                    }
                }
            }

            // Logic A: Recently Accepted (Last 48 hours)
            if (statusRaw === 'Accepted' && qtnTimestamp) {
                const createdDate = new Date(qtnTimestamp);
                if (!isNaN(createdDate.getTime())) {
                    const diffHours = (actualNow.getTime() - createdDate.getTime()) / (1000 * 3600);
                    if (diffHours >= 0 && diffHours <= 24) {
                        notifications.push({
                            id: `qtn-accepted-${qtnNumber}`,
                            type: 'accepted_quotation',
                            title: `Success! Quotation Accepted`,
                            message: `${clientName} has accepted Quotation ${qtnNumber}.`,
                            date: qtnTimestamp,
                            link: `/invoice/edit/${qtnNumber}?type=Quotation`,
                            priority: 'medium'
                        });
                    }
                }
            }

            // Logic B: Expiring Soon
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
