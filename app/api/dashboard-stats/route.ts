import { NextResponse } from "next/server";
import { getSheetsClient } from "@/app/lib/sheets";
import { getSubdomainFromRequest, getTenantSheetId } from "@/lib/user.id";

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
    paidInvoices: { count: number; value: number; growth: number };
    overdue: { count: number; value: number };
    quotations: StatBase & { count: number };
    acceptedQuotations: StatBase & { count: number }; 
    overdueQuotations: { count: number; value: number }; // Added for Overdue Quotations
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
    return d1.getUTCFullYear() === d2.getUTCFullYear() && d1.getUTCMonth() === d2.getUTCMonth();
}

function isSameYear(d1: Date, d2: Date): boolean {
    return d1.getUTCFullYear() === d2.getUTCFullYear();
}

/**
 * Robust date parser for spreadsheet dates
 */
function parseSpreadsheetDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    
    // Try standard ISO/Date format first
    let d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
        // Force to UTC midnight to avoid local shifts
        return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    }

    // Try DD-MM-YYYY
    const dmyt = dateStr.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (dmyt) {
        return new Date(Date.UTC(parseInt(dmyt[3]), parseInt(dmyt[2]) - 1, parseInt(dmyt[1])));
    }

    // Try YYYY-MM-DD
    const ymd = dateStr.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
    if (ymd) {
        return new Date(Date.UTC(parseInt(ymd[1]), parseInt(ymd[2]) - 1, parseInt(ymd[3])));
    }

    return null;
}


export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const period = (searchParams.get("period") || "monthly") as 'monthly' | 'yearly' | 'all';
        const yearParam = searchParams.get("year");
        const monthParam = searchParams.get("month");

        const subdomain = getSubdomainFromRequest(req);
         const SHEET_ID = await getTenantSheetId(subdomain);
                   if (!SHEET_ID) {
                     return NextResponse.json(
                       { ok: false, error: "Sheet ID not found" },
                       { status: 404 }
                     );
                   }
                 

        const sheets = getSheetsClient();
        
        // Fetch both Invoices and Quotations
        const [invoiceRes, quotationRes] = await Promise.all([
            sheets.spreadsheets.values.get({
                spreadsheetId: SHEET_ID,
                range: "Invoices!A:P", // Widen range
            }),
            sheets.spreadsheets.values.get({
                spreadsheetId: SHEET_ID,
                range: "Quotations!A:P",
            })
        ]);

        const invoiceRows = (invoiceRes.data.values || []).slice(1);
        const quotationRows = (quotationRes.data.values || []).slice(1);
        
        // Determine "Now" (Selected Date) based on params or current date
        const currentDate = new Date();
        // Use UTC for "now" reference to match parsed dates
        let now = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate()));
        
        if (yearParam) {
            now.setUTCFullYear(parseInt(yearParam));
        }
        if (monthParam) {
            now.setUTCMonth(parseInt(monthParam));
        }
        
        if (period === 'yearly') now.setUTCMonth(0);

        const prevDate = new Date(now);
        if (period === 'monthly' || period === 'all') {
            prevDate.setUTCMonth(prevDate.getUTCMonth() - 1);
        } else if (period === 'yearly') {
            prevDate.setUTCFullYear(prevDate.getUTCFullYear() - 1);
        }

        // Accumulators
        const currentStats = { revenue: 0, invoices: 0, vat: 0, outstanding: 0, outstandingCount: 0, paid: 0, paidCount: 0, quotations: 0, quotationValue: 0, acceptedQuotations: 0, acceptedQuotationValue: 0, overdueQuotations: 0, overdueQuotationValue: 0 };
        const prevStats = { revenue: 0, invoices: 0, vat: 0, outstanding: 0, outstandingCount: 0, paid: 0, paidCount: 0, quotations: 0, quotationValue: 0, acceptedQuotations: 0, acceptedQuotationValue: 0, overdueQuotations: 0, overdueQuotationValue: 0 };
        const overdueStats = { count: 0, value: 0 };
        const overdueQuotationGlobal = { count: 0, value: 0 }; // Global (all time) overdue quotations

        // Chart Accumulators
        const chartMap: Record<string, number> = {};
        const statusMap = { Paid: 0, Pending: 0, Overdue: 0 };

        // Process Invoices
        invoiceRows.forEach(row => {
            const dateStr = row[2];
            const statusRaw = row[11] || "Unpaid";
            let statusNormalized = statusRaw.trim().toLowerCase();
            if (statusNormalized === 'pending') statusNormalized = 'unpaid';
            
            const isPaid = statusNormalized === 'paid';
            const isOverdue = statusNormalized === 'overdue';
            const isUnpaid = statusNormalized === 'unpaid';

            const payload = row[9];
            let invoiceTotal = 0;
            let invoiceSubtotal = 0;
            
            if (payload) {
                try {
                    const data = JSON.parse(payload);
                    if (data.overrideTotal) {
                        invoiceTotal = parseFloat(data.overrideTotal) || 0;
                        invoiceSubtotal = invoiceTotal / 1.05; // Estimate subtotal if only total is overridden
                    } else if (Array.isArray(data.lineItems)) {
                        invoiceSubtotal = data.lineItems.reduce((acc: number, line: any) => acc + (parseFloat(line.unitPrice) * (line.quantity || 1)), 0);
                        invoiceTotal = invoiceSubtotal * 1.05;
                    }
                } catch(e) {}
            }

            // Fallback to columns if payload calculation failed
            if (invoiceTotal === 0) {
                 invoiceTotal = parseFloat((row[8] || "0").replace(/[^0-9.-]+/g,"")) || 0;
                 invoiceSubtotal = parseFloat((row[7] || "0").replace(/[^0-9.-]+/g,"")) || 0;
                 if (invoiceSubtotal === 0 && invoiceTotal > 0) invoiceSubtotal = invoiceTotal / 1.05;
            }

            const invoiceDate = parseSpreadsheetDate(dateStr);
            if (!invoiceDate) return;

            // OVERDUE LOGIC (Static check for all time overdue count)
            if (!isPaid && !isOverdue) {
                const diffTime = now.getTime() - invoiceDate.getTime();
                const diffDays = diffTime / (1000 * 3600 * 24);
                if (diffDays > 30) {
                    overdueStats.count++;
                    overdueStats.value += invoiceTotal;
                    statusNormalized = 'overdue'; // Treat as overdue for current stats
                }
            } else if (isOverdue) {
                overdueStats.count++;
                overdueStats.value += invoiceTotal;
            }

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

            if (isCurrent) {
                currentStats.invoices++;
                if (isPaid) {
                    currentStats.revenue += invoiceTotal;
                    currentStats.paid += invoiceTotal;
                    currentStats.paidCount++;
                    currentStats.vat += (invoiceTotal - invoiceSubtotal);
                    statusMap.Paid += 1;
                    
                    let key = "";
                    if (period === 'monthly') key = invoiceDate.getUTCDate().toString(); 
                    else if (period === 'yearly') key = invoiceDate.toLocaleString('default', { month: 'short', timeZone: 'UTC' }); 
                    else key = invoiceDate.getUTCFullYear().toString(); 
                    chartMap[key] = (chartMap[key] || 0) + invoiceTotal;
                } else if (statusNormalized === 'overdue') {
                    currentStats.outstanding += invoiceTotal;
                    currentStats.outstandingCount++; 
                    statusMap.Overdue += 1;
                } else {
                    currentStats.outstanding += invoiceTotal;
                    currentStats.outstandingCount++;
                    statusMap.Pending += 1;
                }
            }
            
            if (isPrevious) {
                 prevStats.invoices++;
                 if (isPaid) {
                    prevStats.revenue += invoiceTotal;
                    prevStats.paid += invoiceTotal;
                    prevStats.paidCount++;
                    prevStats.vat += (invoiceTotal - invoiceSubtotal);
                } else {
                    prevStats.outstanding += invoiceTotal;
                    prevStats.outstandingCount++;
                }
            }
        });

        // Process Quotations
        quotationRows.forEach(row => {
            const dateStr = row[2];
            const payload = row[9];
            const statusRaw = row[11];
            const validityDateStr = row[15]; // Column P
            
            let qtnTotal = 0;
            if (payload) {
                try {
                    const data = JSON.parse(payload);
                    if (data.overrideTotal) {
                        qtnTotal = parseFloat(data.overrideTotal) || 0;
                    } else if (Array.isArray(data.lineItems)) {
                        qtnTotal = data.lineItems.reduce((acc: number, line: any) => acc + (parseFloat(line.unitPrice) * (line.quantity || 1)), 0);
                    }
                } catch(e) {}
            }
            if (qtnTotal === 0) {
                 const colTotal = parseFloat((row[8] || "0").replace(/[^0-9.-]+/g,""));
                 qtnTotal = colTotal || 0;
            }

            const qtnDate = new Date(dateStr);
            if (isNaN(qtnDate.getTime())) return;

            // --- OVERDUE QUOTATION LOGIC ---
            const isAccepted = statusRaw?.trim().toLowerCase() === 'accepted';
            if (!isAccepted && validityDateStr) {
                const validityDate = new Date(validityDateStr);
                if (!isNaN(validityDate.getTime()) && validityDate < now) {
                    overdueQuotationGlobal.count++;
                    overdueQuotationGlobal.value += qtnTotal;
                }
            }

            let isCurrent = false;
            let isPrevious = false;

            if (period === 'all') {
                isCurrent = true; 
            } else if (period === 'monthly') {
                if (isSameMonth(qtnDate, now)) isCurrent = true;
                if (isSameMonth(qtnDate, prevDate)) isPrevious = true;
            } else if (period === 'yearly') {
                if (isSameYear(qtnDate, now)) isCurrent = true;
                if (isSameYear(qtnDate, prevDate)) isPrevious = true;
            }

            if (isCurrent) {
                currentStats.quotations++;
                currentStats.quotationValue += qtnTotal;
                if (isAccepted) {
                    currentStats.acceptedQuotations++;
                    currentStats.acceptedQuotationValue += qtnTotal;
                }
            }
            if (isPrevious) {
                prevStats.quotations++;
                prevStats.quotationValue += qtnTotal;
                if (isAccepted) {
                    prevStats.acceptedQuotations++;
                    prevStats.acceptedQuotationValue += qtnTotal;
                }
            }
        });

        // VAT is now accumulated during the loop for better accuracy
        // currentStats.vat = currentStats.paid * 0.05;
        // prevStats.vat = prevStats.paid * 0.05;

        let chartData: { name: string, revenue: number }[] = [];
        if (period === 'monthly') {
            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            for (let i = 1; i <= daysInMonth; i++) {
                chartData.push({ name: i.toString(), revenue: chartMap[i.toString()] || 0 });
            }
        } else if (period === 'yearly') {
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            months.forEach(m => { chartData.push({ name: m, revenue: chartMap[m] || 0 }); });
        } else {
             Object.keys(chartMap).sort().forEach(k => { chartData.push({ name: k, revenue: chartMap[k] }); });
        }

        const pieData = [
            { name: "Paid", value: statusMap.Paid, color: "#22c55e" },
            { name: "Pending", value: statusMap.Pending, color: "#f97316" },
            { name: "Overdue", value: statusMap.Overdue, color: "#ef4444" },
        ];

        const calcGrowth = (curr: number, prev: number) => {
            if (period === 'all') return 0;
            if (prev === 0) return curr > 0 ? 100 : 0; 
            return ((curr - prev) / prev) * 100;
        };

        const response: DashboardStats & { chartData: any[], pieData: any[] } = {
            revenue: { value: currentStats.revenue, growth: calcGrowth(currentStats.revenue, prevStats.revenue) },
            invoices: { value: currentStats.invoices, growth: calcGrowth(currentStats.invoices, prevStats.invoices) },
            vat: { value: currentStats.vat, growth: calcGrowth(currentStats.vat, prevStats.vat) },
            outstanding: { value: currentStats.outstanding, count: currentStats.outstandingCount, growth: calcGrowth(currentStats.outstanding, prevStats.outstanding) },
            paidInvoices: { 
                count: currentStats.paidCount, 
                value: currentStats.revenue, 
                growth: calcGrowth(currentStats.paidCount, prevStats.paidCount) 
            },
            overdue: overdueStats,
            quotations: { 
                count: currentStats.quotations, 
                value: currentStats.quotationValue, 
                growth: calcGrowth(currentStats.quotations, prevStats.quotations) 
            },
            acceptedQuotations: {
                count: currentStats.acceptedQuotations,
                value: currentStats.acceptedQuotationValue,
                growth: calcGrowth(currentStats.acceptedQuotations, prevStats.acceptedQuotations)
            },
            overdueQuotations: overdueQuotationGlobal,
            chartData,
            pieData
        };

        return NextResponse.json(response);

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
