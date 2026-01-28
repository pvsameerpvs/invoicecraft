import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSheetsClient, logActivity } from "../../lib/sheets";
import { getSubdomainFromRequest, getTenantSheetId } from "@/lib/user.id";

export const dynamic = 'force-dynamic';
export const runtime = "nodejs";

function money(n: number) {
  if (!Number.isFinite(n)) return "0.00";
  return n.toFixed(2);
}

async function syncQuotationStatus(sheets: any, spreadsheetId: string, quotationNumber: string, status: string) {
    try {
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: "Quotations!A1:M",
        });
        const rows = res.data.values || [];
        const rowIndex = rows.findIndex((r: any) => (r[1] || "").toString().trim() === quotationNumber);
        
        if (rowIndex !== -1) {
            const rowNumber = rowIndex + 1;
            const row = rows[rowIndex];
            let payload = row[9] || "{}"; // Column J
            
            try {
                const parsed = JSON.parse(payload);
                parsed.status = status;
                payload = JSON.stringify(parsed);
            } catch (e) {
                console.error("Failed to update payload status", e);
            }

            // Update Column J (Payload) and Column L (Status)
            // Range J to L: [J, K, L] -> [Index 9, 10, 11]
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `Quotations!J${rowNumber}:L${rowNumber}`,
                valueInputOption: "USER_ENTERED",
                requestBody: {
                    values: [[payload, row[10] || "", status]]
                }
            });
            console.log(`Synced Quotation ${quotationNumber} status to ${status}`);
        }
    } catch (err) {
        console.error("Failed to sync quotation status", err);
    }
}

async function ensureSheets(sheets: any, spreadsheetId: string) {
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const existingSheets = meta.data.sheets?.map((s: any) => s.properties?.title) || [];
    const requests: any[] = [];

    const neededSheets = ["Invoices", "LineItems", "Quotations", "QuotationLineItems"];
    neededSheets.forEach(s => {
        if (!existingSheets.includes(s)) {
            requests.push({ addSheet: { properties: { title: s } } });
        }
    });

    if (requests.length > 0) {
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: { requests }
        });
    }

    // Always ensure headers are up to date for main sheets
    const mainHeader = ["Timestamp", "Number", "Date", "Client", "Subject", "Currency", "Subtotal", "VAT", "Total", "Payload", "Created By", "Status", "Type", "Client Email", "Client Phone", "Validity Date"];
    const lineHeader = ["Number", "ID", "Description", "Quantity", "Unit Price", "Amount"];

    await Promise.all([
        sheets.spreadsheets.values.update({
            spreadsheetId,
            range: "Invoices!A1:P1",
            valueInputOption: "USER_ENTERED",
            requestBody: { values: [mainHeader] }
        }),
        sheets.spreadsheets.values.update({
            spreadsheetId,
            range: "Quotations!A1:P1",
            valueInputOption: "USER_ENTERED",
            requestBody: { values: [mainHeader] }
        }),
        sheets.spreadsheets.values.update({
            spreadsheetId,
            range: "LineItems!A1:F1",
            valueInputOption: "USER_ENTERED",
            requestBody: { values: [lineHeader] }
        }),
        sheets.spreadsheets.values.update({
            spreadsheetId,
            range: "QuotationLineItems!A1:F1",
            valueInputOption: "USER_ENTERED",
            requestBody: { values: [lineHeader] }
        })
    ]);
}

/**
 * POST /api/invoice-history
 * Body: InvoiceData (full invoice json)
 * Saves:
 * - one row to Invoices!A:J
 * - line items to LineItems!A:D  
 */
export async function POST(req: Request) {
  try {
    const subdomain = getSubdomainFromRequest(req);
    const SHEET_ID = await getTenantSheetId(subdomain);
  if (!SHEET_ID) {
  return NextResponse.json(
    { ok: false, error: "Sheet ID not found" },
    { status: 404 }
  );
  }
                     

    const invoice = await req.json();

    const sheets = getSheetsClient();

    const createdAt = new Date().toISOString();

    const subtotal = (invoice.lineItems || []).reduce((sum: number, it: any) => {
      const price = parseFloat(it.unitPrice);
      const qty = parseInt(it.quantity) || 1;
      return sum + (Number.isFinite(price) ? price * qty : 0);
    }, 0);

    const vat = subtotal * 0.05;

    const currency =
      invoice.currency && String(invoice.currency).trim().length > 0
        ? String(invoice.currency).trim()
        : "AED";

    const invoiceNumber =
      invoice.invoiceNumber && String(invoice.invoiceNumber).trim().length > 0
        ? String(invoice.invoiceNumber).trim()
        : `INV-${Date.now()}`;

    const isQuotation = (invoice.documentType || "Invoice") === "Quotation";
    const mainSheet = isQuotation ? "Quotations" : "Invoices";
    const lineSheet = isQuotation ? "QuotationLineItems" : "LineItems";

    if (isQuotation) {
        await ensureSheets(sheets, SHEET_ID);
    }

    // ✅ Check if number already exists
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${mainSheet}!B:B`, 
    });

    const existingNumbers = (existing.data.values || []).flat();
    if (existingNumbers.includes(invoiceNumber)) {
      return NextResponse.json(
        { ok: false, error: `${isQuotation ? "Quotation" : "Invoice"} number "${invoiceNumber}" already exists.` },
        { status: 409 }
      );
    }

    const total =
      invoice.overrideTotal && String(invoice.overrideTotal).trim().length > 0
        ? parseFloat(invoice.overrideTotal)
        : subtotal + vat;

    // ✅ Save row
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${mainSheet}!A:P`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          [
            createdAt,
            invoiceNumber,
            invoice.date || "",
            invoice.invoiceToCompany || "",
            invoice.subject || "",
            currency,
            money(subtotal),
            money(vat),
            money(total),
            JSON.stringify({ ...invoice, invoiceNumber }),
            invoice.createdBy || "", 
            isQuotation ? (invoice.status === "Accepted" ? "Draft" : (invoice.status || "Draft")) : (invoice.status || "Unpaid"),
            invoice.documentType || "Invoice",
            invoice.invoiceToEmail || "",
            invoice.invoiceToPhone || "",
            invoice.validityDate || "",
          ],
        ],
      },
    });

    // ✅ Save line items
    const lineRows = (invoice.lineItems || []).map((it: any) => [
      invoiceNumber,
      it.id || "",
      it.description || "",
      it.quantity || 1,
      it.unitPrice || "",
      money((parseFloat(it.unitPrice) || 0) * (parseInt(it.quantity) || 1)),
    ]);

    if (lineRows.length > 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: `${lineSheet}!A:F`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: lineRows },
      });
    }

    // ✅ Log Activity
    const userAgent = req.headers.get("user-agent");
    logActivity(invoice.createdBy || "Unknown", `CREATED ${invoiceNumber}`, userAgent).catch(console.error);

    // ✅ Sync Quotation Status
    if (!isQuotation && invoice.sourceQuotation && invoice.status === "Paid") {
        syncQuotationStatus(sheets, SHEET_ID, invoice.sourceQuotation, "Accepted").catch(console.error);
    }

    return NextResponse.json({ ok: true, invoiceNumber });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Failed" },
      { status: 500 }
    );
  }
}

async function deleteLineItems(sheets: any, sheetId: string, invoiceNumber: string, isQuotation: boolean = false) {
    try {
        const lineSheetName = isQuotation ? "QuotationLineItems" : "LineItems";
        const sheetDetails = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
        const lineItemsSheet = sheetDetails.data.sheets?.find((s: any) => s.properties?.title === lineSheetName);
        const lineItemsSheetId = lineItemsSheet?.properties?.sheetId;

        if (lineItemsSheetId !== undefined) {
             const lineItemsRes = await sheets.spreadsheets.values.get({
                spreadsheetId: sheetId,
                range: `${lineSheetName}!A:A`, 
            });

            const lineRows = lineItemsRes.data.values || [];
            
            // Find all row indices to delete (descending order to avoid index shift)
            const rowsToDelete: number[] = [];
            lineRows.forEach((r: any, idx: number) => {
                if ((r[0] || "").toString().trim() === invoiceNumber) {
                    rowsToDelete.push(idx);
                }
            });

            // Sort descending: 5, 2, 1
            rowsToDelete.sort((a, b) => b - a);

            if (rowsToDelete.length > 0) {
                 const deleteRequests = rowsToDelete.map(idx => ({
                    deleteDimension: {
                        range: {
                            sheetId: lineItemsSheetId,
                            dimension: "ROWS",
                            startIndex: idx,
                            endIndex: idx + 1
                        }
                    }
                }));

                await sheets.spreadsheets.batchUpdate({
                    spreadsheetId: sheetId,
                    requestBody: {
                        requests: deleteRequests
                    }
                });
                console.log(`Deleted ${rowsToDelete.length} line items for ${invoiceNumber}`);
            }
        }
    } catch (err) {
        console.error("Failed to delete line items:", err);
    }
}

/**
 * PUT /api/invoice-history
 * Body: { originalInvoiceNumber, invoice }
 * Updates the existing row for originalInvoiceNumber
 */
export async function PUT(req: Request) {
  try {
         const subdomain = getSubdomainFromRequest(req);
    const SHEET_ID = await getTenantSheetId(subdomain);
                   if (!SHEET_ID) {
                     return NextResponse.json(
                       { ok: false, error: "Sheet ID not found" },
                       { status: 404 }
                     );
                   }
                 

    const { originalInvoiceNumber, invoice, currentUser } = await req.json();
    const currentRole = (cookies().get("invoicecraft_role")?.value || "user").toLowerCase().trim();

    if (!originalInvoiceNumber || !invoice) {
      return NextResponse.json(
        { ok: false, error: "Missing originalInvoiceNumber or invoice data" },
        { status: 400 }
      );
    }

    const isQuotation = (invoice.documentType || "Invoice") === "Quotation";
    const mainSheet = isQuotation ? "Quotations" : "Invoices";
    const lineSheet = isQuotation ? "QuotationLineItems" : "LineItems";

    const sheets = getSheetsClient();
    if (isQuotation) {
        await ensureSheets(sheets, SHEET_ID);
    }

    // 1. Find the row index
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${mainSheet}!A:M`, 
    });

    const rows = res.data.values || [];
    
    console.log("Searching for:", originalInvoiceNumber);
    
    const rowIndex = rows.findIndex((r) => {
        const sheetVal = (r[1] || "").toString().trim(); // Column B is Index 1
        const searchVal = (originalInvoiceNumber || "").toString().trim();
        return sheetVal === searchVal;
    });

    if (rowIndex === -1) {
      console.log("Invoice numbers in sheet:", rows.map(r => r[1]));
      return NextResponse.json(
        { ok: false, error: `Original invoice "${originalInvoiceNumber}" not found in sheet` },
        { status: 404 }
      );
    }

    // Permission Check
    const row = rows[rowIndex];
    const createdBy = (row[10] || "").toString().trim(); // Column K is index 10

    if (currentRole !== "admin" && createdBy !== currentUser) {
       return NextResponse.json(
        { ok: false, error: "You are not authorized to edit this invoice" },
        { status: 403 }
      );
    }

    const sheetRowNumber = rowIndex + 1; // 1-based index

    // Recalculate totals
    const subtotal = (invoice.lineItems || []).reduce((sum: number, it: any) => {
      const price = parseFloat(it.unitPrice);
      const qty = parseInt(it.quantity) || 1;
      return sum + (Number.isFinite(price) ? price * qty : 0);
    }, 0);

    const vat = subtotal * 0.05;
    const total =
      invoice.overrideTotal && String(invoice.overrideTotal).trim().length > 0
        ? parseFloat(invoice.overrideTotal)
        : subtotal + vat;
    const currency = invoice.currency || "AED";

    // 2. Update the row
    const rangeToUpdate = `${mainSheet}!B${sheetRowNumber}:P${sheetRowNumber}`;

    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: rangeToUpdate,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          [
            invoice.invoiceNumber, 
            invoice.date || "", 
            invoice.invoiceToCompany || "", 
            invoice.subject || "", 
            currency, 
            money(subtotal), 
            money(vat), 
            money(total), 
            JSON.stringify({ ...invoice, invoiceNumber: invoice.invoiceNumber }), 
            createdBy, 
            isQuotation ? (invoice.status === "Accepted" ? "Draft" : (invoice.status || "Draft")) : (invoice.status || "Unpaid"), 
            invoice.documentType || "Invoice", 
            invoice.invoiceToEmail || "",
            invoice.invoiceToPhone || "",
            invoice.validityDate || "",
          ],
        ],
      },
    });

    // 3. Sync Line Items (Delete Old -> Insert New)
    await deleteLineItems(sheets, SHEET_ID, originalInvoiceNumber, isQuotation);

    const lineRows = (invoice.lineItems || []).map((it: any) => [
      invoice.invoiceNumber,
      it.id || "",
      it.description || "",
      it.quantity || 1,
      it.unitPrice || "",
      money((parseFloat(it.unitPrice) || 0) * (parseInt(it.quantity) || 1)),
    ]);

    if (lineRows.length > 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: `${lineSheet}!A:F`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: lineRows },
      });
    }

    // ✅ Log Activity
    const userAgent = req.headers.get("user-agent");
    logActivity(currentUser || "Unknown", `UPDATED ${invoice.invoiceNumber}`, userAgent).catch(console.error);

    // ✅ Sync Quotation Status
    if (!isQuotation && invoice.sourceQuotation && invoice.status === "Paid") {
        syncQuotationStatus(sheets, SHEET_ID, invoice.sourceQuotation, "Accepted").catch(console.error);
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Failed update" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/invoice-history
 * Returns list newest first
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const qSearch = (searchParams.get("search") || "").toLowerCase().trim();
    const qClient = (searchParams.get("client") || "").toLowerCase().trim();
    const qStatus = (searchParams.get("status") || "").toLowerCase().trim();
    const qDate = (searchParams.get("date") || "").trim();
    const qUser = (searchParams.get("user") || "").toLowerCase().trim();

    const currentUser = cookies().get("invoicecraft_auth")?.value || "";
    const currentRole = (cookies().get("invoicecraft_role")?.value || "user").toLowerCase().trim();

         const subdomain = getSubdomainFromRequest(req);
    const SHEET_ID = await getTenantSheetId(subdomain);
                   if (!SHEET_ID) {
                     return NextResponse.json(
                       { ok: false, error: "Sheet ID not found" },
                       { status: 404 }
                     );
                   }
                 

    const sheets = getSheetsClient();
    const typeFilter = searchParams.get("type") || "Invoice";
    const mainSheet = typeFilter === "Quotation" ? "Quotations" : "Invoices";

    if (typeFilter === "Quotation") {
        await ensureSheets(sheets, SHEET_ID);
    }

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${mainSheet}!A:P`,
    });

    const rows = res.data.values || [];
    if (rows.length <= 1) return NextResponse.json([]); // only header row exists

    const dataRows = rows.slice(1);

    const list = dataRows
      .map((r) => ({
        createdAt: r[0] || "",
        invoiceNumber: r[1] || "",
        date: r[2] || "",
        clientName: r[3] || "",
        subject: r[4] || "",
        currency: r[5] || "AED",
        subtotal: r[6] || "0.00",
        vat: r[7] || "0.00",
        total: r[8] || "0.00",
        payloadJson: r[9] || "",
        createdBy: r[10] || "",
        status: r[11] || "Unpaid",
        documentType: (r[12] || "Invoice") as "Invoice" | "Quotation",
        clientEmail: r[13] || "",
        clientPhone: r[14] || "",
        validityDate: r[15] || "",
        quotationNumber: (r[12] === "Quotation") ? (r[1] || "") : undefined,
      }))
      .filter((item) => {
        // 1. Search (Invoice # or Client)
        if (qSearch) {
          const matchInv = item.invoiceNumber.toLowerCase().includes(qSearch);
          const matchCli = item.clientName.toLowerCase().includes(qSearch);
          if (!matchInv && !matchCli) return false;
        }

        // 2. Client Filter (Exact or partial? Let's do partial for flexibility)
        if (qClient && !item.clientName.toLowerCase().includes(qClient)) {
          return false;
        }

        // 3. Status Filter (Exact, case insensitive)
        if (qStatus && item.status.toLowerCase() !== qStatus) {
           // Allow "all" to skip
           if (qStatus !== "all") return false;
        }

        // 4. Date Filter (Exact match YYYY-MM-DD)
        if (qDate && item.date !== qDate) {
          return false;
        }

        // 5. User Filter (Exact or partial)
        if (qUser && !item.createdBy.toLowerCase().includes(qUser)) {
          return false;
        }

        // 6. Year & Month Filter
        // 6. Year & Month Filter
        if (searchParams.has('year') || searchParams.has('month')) {
            const d = new Date(item.date); // item.date is YYYY-MM-DD string usually, or ISO
            
            if (searchParams.has('year')) {
                const year = parseInt(searchParams.get('year') || "");
                if (!isNaN(year) && d.getFullYear() !== year) {
                    return false;
                }
            }

            if (searchParams.has('month')) {
                const month = parseInt(searchParams.get('month') || "");
                if (!isNaN(month) && d.getMonth() !== month) {
                    return false;
                }
            }
        }

        return true;
      })
      .reverse(); // newest first

    return NextResponse.json(list);
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Failed" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/invoice-history
 * Body: { invoiceNumber }
 * Deletes the row for the given invoice number
 */
export async function DELETE(req: Request) {
  try {
         const subdomain = getSubdomainFromRequest(req);
    const SHEET_ID = await getTenantSheetId(subdomain);
                   if (!SHEET_ID) {
                     return NextResponse.json(
                       { ok: false, error: "Sheet ID not found" },
                       { status: 404 }
                     );
                   }
                 

    const { invoiceNumber, currentUser, documentType } = await req.json();
    const isQuotation = documentType === "Quotation";
    const mainSheet = isQuotation ? "Quotations" : "Invoices";

    const currentRole = (cookies().get("invoicecraft_role")?.value || "user").toLowerCase().trim();

    if (!invoiceNumber) {
      return NextResponse.json(
        { ok: false, error: "Missing invoiceNumber" },
        { status: 400 }
      );
    }

    const sheets = getSheetsClient();
    if (isQuotation) {
        await ensureSheets(sheets, SHEET_ID);
    }

    // 1. Find the row index and check permissions
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${mainSheet}!A:M`, 
    });

    const rows = res.data.values || [];
    const rowIndex = rows.findIndex((r) => {
        const sheetVal = (r[1] || "").toString().trim(); 
        const searchVal = (invoiceNumber || "").toString().trim();
        return sheetVal === searchVal;
    });

    if (rowIndex === -1) {
      return NextResponse.json(
        { ok: false, error: `${isQuotation ? "Quotation" : "Invoice"} not found` },
        { status: 404 }
      );
    }

    // Permission Check
    const row = rows[rowIndex];
    const createdBy = (row[10] || "").toString().trim(); // Column K is index 10

    if (currentRole !== "admin" && createdBy !== currentUser) {
       return NextResponse.json(
        { ok: false, error: "You are not authorized to delete this invoice" },
        { status: 403 }
      );
    }

    const sheetDetails = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
    const sheet = sheetDetails.data.sheets?.find(s => s.properties?.title === mainSheet);
    const sheetIdNum = sheet?.properties?.sheetId;

    if (sheetIdNum === undefined) {
         throw new Error(`Could not find ${mainSheet} sheet ID`);
    }

    await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: {
            requests: [
                {
                    deleteDimension: {
                        range: {
                            sheetId: sheetIdNum,
                            dimension: "ROWS",
                            startIndex: rowIndex, // Inclusive (0-based)
                            endIndex: rowIndex + 1 // Exclusive
                        }
                    }
                }
            ]
        }
    });

    // 2. Cascade Delete Line Items
    await deleteLineItems(sheets, SHEET_ID, invoiceNumber, isQuotation);

    // ✅ Log Activity
    const userAgent = req.headers.get("user-agent");
    logActivity(currentUser || "Unknown", `DELETED ${invoiceNumber}`, userAgent).catch(console.error);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Failed to delete" },
      { status: 500 }
    );
  }
}
