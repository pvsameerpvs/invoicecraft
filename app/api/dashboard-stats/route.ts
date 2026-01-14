import { NextResponse } from "next/server";
import { getSheetsClient } from "../../lib/sheets";

export const dynamic = 'force-dynamic';
export const runtime = "nodejs";

interface StatBase {
    value: number;
    growth: number;
}

export interface DashboardStats {
    revenue: StatBase;
    invoices: StatBase;
    vat: StatBase;
    outstanding: StatBase & { count: number };
    overdue: { count: number; value: number };
}

// ... existing helpers ...

function getPreviousPeriod(date: Date, period: 'monthly' | 'yearly'): Date {
    const prev = new Date(date);
    if (period === 'monthly') {
        prev.setMonth(prev.getMonth() - 1);
    } else if (period === 'yearly') {
        prev.setFullYear(prev.getFullYear() - 1);
    }
    return prev;
}

function isSameMonth(d1: Date, d2: Date): boolean {
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
}

function isSameYear(d1: Date, d2: Date): boolean {
    return d1.getFullYear() === d2.getFullYear();
}


export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const period = (searchParams.get("period") || "monthly") as 'monthly' | 'yearly' | 'all';

        const sheetId = "1oo7G79VtN-zIQzlpKzVHGKGDObWik7MUPdVA2ZrEayQ";
         if (!sheetId) throw new Error("Missing GOOGLE_SHEET_ID");

        const sheets = getSheetsClient();
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            range: "Invoices!A:L",
        });

        const rows = (res.data.values || []).slice(1); // skip header
        
        const now = new Date();
        const prevDate = getPreviousPeriod(now, period === 'all' ? 'monthly' : period);

        // Accumulators
        const currentStats = { revenue: 0, invoices: 0, vat: 0, outstanding: 0, outstandingCount: 0, paid: 0 };
        const prevStats = { revenue: 0, invoices: 0, vat: 0, outstanding: 0, outstandingCount: 0, paid: 0 };
        const overdueStats = { count: 0, value: 0 };

        rows.forEach(row => {
            const dateStr = row[2]; // Column C: Date
            const status = row[11] || "Unpaid"; // Column L: Status
            const payload = row[9]; // Column J: Payload
            
            let invoiceTotal = 0;
            if (payload) {
                try {
                    const data = JSON.parse(payload);
                    if (data.overrideTotal) {
                        invoiceTotal = parseFloat(data.overrideTotal) || 0;
                    } else if (Array.isArray(data.lineItems)) {
                        invoiceTotal = data.lineItems.reduce((acc: number, line: any) => acc + (parseFloat(line.amount)||0), 0);
                    }
                } catch(e) {}
            }
            if (invoiceTotal === 0) {
                 const colTotal = parseFloat((row[8] || "0").replace(/[^0-9.-]+/g,""));
                 invoiceTotal = colTotal || 0;
            }

            const invoiceDate = new Date(dateStr);
            if (isNaN(invoiceDate.getTime())) return;

            // --- OVERDUE LOGIC (Global, regardless of period filter usually, but let's calculate total current overdue) ---
            if (status !== 'Paid') {
                const diffTime = now.getTime() - invoiceDate.getTime();
                const diffDays = diffTime / (1000 * 3600 * 24);
                if (diffDays > 30) {
                    overdueStats.count++;
                    overdueStats.value += invoiceTotal;
                }
            }

            // --- PERIOD LOGIC ---
            let isCurrent = false;
            let isPrevious = false;

            if (period === 'all') {
                isCurrent = true; 
            } else if (period === 'monthly') {
                if (isSameMonth(invoiceDate, now)) isCurrent = true;
                if (isSameMonth(invoiceDate, prevDate)) isPrevious = true;
            } else if (period === 'yearly') {
                if (isSameYear(invoiceDate, now)) isCurrent = true;
                if (isSameYear(invoiceDate, prevDate)) isPrevious = true;
            }

            // --- ACCUMULATE ---
            if (isCurrent) {
                currentStats.invoices++;
                
                if (status === 'Paid') {
                    currentStats.revenue += invoiceTotal;
                    currentStats.paid += invoiceTotal;
                } else {
                    currentStats.outstanding += invoiceTotal;
                    currentStats.outstandingCount++;
                }
            }
            
            if (isPrevious) {
                 prevStats.invoices++;
                 
                 if (status === 'Paid') {
                    prevStats.revenue += invoiceTotal;
                    prevStats.paid += invoiceTotal;
                } else {
                    prevStats.outstanding += invoiceTotal;
                    prevStats.outstandingCount++;
                }
            }
        });

        // VAT specific: 5% of PAID amount
        currentStats.vat = currentStats.paid * 0.05;
        prevStats.vat = prevStats.paid * 0.05;

        // --- GROWTH FORMULA ---
        const calcGrowth = (curr: number, prev: number) => {
            if (period === 'all') return 0;
            if (prev === 0) return curr > 0 ? 100 : 0; 
            return ((curr - prev) / prev) * 100;
        };

        const response: DashboardStats = {
            revenue: { value: currentStats.revenue, growth: calcGrowth(currentStats.revenue, prevStats.revenue) },
            invoices: { value: currentStats.invoices, growth: calcGrowth(currentStats.invoices, prevStats.invoices) },
            vat: { value: currentStats.vat, growth: calcGrowth(currentStats.vat, prevStats.vat) },
            outstanding: { value: currentStats.outstanding, count: currentStats.outstandingCount, growth: calcGrowth(currentStats.outstanding, prevStats.outstanding) },
            overdue: overdueStats
        };

        return NextResponse.json(response);

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
