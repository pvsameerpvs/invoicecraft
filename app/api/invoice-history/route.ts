import { NextResponse } from "next/server";
import { getSheetsClient, logActivity } from "../../lib/sheets";

export const dynamic = 'force-dynamic';
export const runtime = "nodejs";

function money(n: number) {
  if (!Number.isFinite(n)) return "0.00";
  return n.toFixed(2);
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
    const sheetId = "1oo7G79VtN-zIQzlpKzVHGKGDObWik7MUPdVA2ZrEayQ";
    if (!sheetId) throw new Error("Missing GOOGLE_SHEET_ID");

    const invoice = await req.json();

    const sheets = getSheetsClient();

    const createdAt = new Date().toISOString();

    const subtotal = (invoice.lineItems || []).reduce((sum: number, it: any) => {
      const v = parseFloat(it.amount);
      return sum + (Number.isFinite(v) ? v : 0);
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

    // ✅ Check if invoice number already exists
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Invoices!B:B", // invoice numbers column
    });

    const existingNumbers = (existing.data.values || []).flat();
    if (existingNumbers.includes(invoiceNumber)) {
      return NextResponse.json(
        { ok: false, error: `Invoice number "${invoiceNumber}" already exists.` },
        { status: 409 } // Conflict
      );
    }

    const total =
      invoice.overrideTotal && String(invoice.overrideTotal).trim().length > 0
        ? parseFloat(invoice.overrideTotal)
        : subtotal + vat;

    // ✅ Save invoice row
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "Invoices!A:K",
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
            invoice.createdBy || "", // K: Created By
          ],
        ],
      },
    });

    // ✅ Save line items
    const lineRows = (invoice.lineItems || []).map((it: any) => [
      invoiceNumber,
      it.id || "",
      it.description || "",
      it.amount || "",
    ]);

    if (lineRows.length > 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: "LineItems!A:D",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: lineRows },
      });
    }

    // ✅ Log Activity
    const userAgent = req.headers.get("user-agent");
    logActivity(invoice.createdBy || "Unknown", `CREATED ${invoiceNumber}`, userAgent).catch(console.error);

    return NextResponse.json({ ok: true, invoiceNumber });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Failed" },
      { status: 500 }
    );
  }
}

// Helper to cascade delete line items
async function deleteLineItems(sheets: any, sheetId: string, invoiceNumber: string) {
    try {
        const sheetDetails = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
        const lineItemsSheet = sheetDetails.data.sheets?.find((s: any) => s.properties?.title === "LineItems");
        const lineItemsSheetId = lineItemsSheet?.properties?.sheetId;

        if (lineItemsSheetId !== undefined) {
             const lineItemsRes = await sheets.spreadsheets.values.get({
                spreadsheetId: sheetId,
                range: "LineItems!A:A", // Column A contains Invoice Numbers
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
    const sheetId = "1oo7G79VtN-zIQzlpKzVHGKGDObWik7MUPdVA2ZrEayQ";
    if (!sheetId) throw new Error("Missing GOOGLE_SHEET_ID");

    const { originalInvoiceNumber, invoice, currentUser } = await req.json();

    if (!originalInvoiceNumber || !invoice) {
      return NextResponse.json(
        { ok: false, error: "Missing originalInvoiceNumber or invoice data" },
        { status: 400 }
      );
    }

    const sheets = getSheetsClient();

    // 1. Find the row index
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Invoices!A:K", // Read all columns to get CreatedBy
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

    if (currentUser !== "admin" && createdBy !== currentUser) {
       return NextResponse.json(
        { ok: false, error: "You are not authorized to edit this invoice" },
        { status: 403 }
      );
    }

    const sheetRowNumber = rowIndex + 1; // 1-based index

    // Recalculate totals
    const subtotal = (invoice.lineItems || []).reduce((sum: number, it: any) => {
      const v = parseFloat(it.amount);
      return sum + (Number.isFinite(v) ? v : 0);
    }, 0);

    const vat = subtotal * 0.05;
    const total =
      invoice.overrideTotal && String(invoice.overrideTotal).trim().length > 0
        ? parseFloat(invoice.overrideTotal)
        : subtotal + vat;
    const currency = invoice.currency || "AED";

    // 2. Update the row
    const rangeToUpdate = `Invoices!B${sheetRowNumber}:J${sheetRowNumber}`;

    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: rangeToUpdate,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          [
            invoice.invoiceNumber, // B: New Invoice Number (might be same)
            invoice.date || "", // C
            invoice.invoiceToCompany || "", // D
            invoice.subject || "", // E
            currency, // F
            money(subtotal), // G
            money(vat), // H
            money(total), // I
            JSON.stringify({ ...invoice, invoiceNumber: invoice.invoiceNumber }), // J
          ],
        ],
      },
    });

    // 3. Sync Line Items (Delete Old -> Insert New)
    await deleteLineItems(sheets, sheetId, originalInvoiceNumber);

    const lineRows = (invoice.lineItems || []).map((it: any) => [
      invoice.invoiceNumber,
      it.id || "",
      it.description || "",
      it.amount || "",
    ]);

    if (lineRows.length > 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: "LineItems!A:D",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: lineRows },
      });
    }

    // ✅ Log Activity
    const userAgent = req.headers.get("user-agent");
    logActivity(currentUser || "Unknown", `UPDATED ${invoice.invoiceNumber}`, userAgent).catch(console.error);

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
export async function GET() {
  try {
    const sheetId = "1oo7G79VtN-zIQzlpKzVHGKGDObWik7MUPdVA2ZrEayQ";
    if (!sheetId) throw new Error("Missing GOOGLE_SHEET_ID");

    const sheets = getSheetsClient();

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Invoices!A:K",
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
      }))
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
    const sheetId = "1oo7G79VtN-zIQzlpKzVHGKGDObWik7MUPdVA2ZrEayQ";
    if (!sheetId) throw new Error("Missing GOOGLE_SHEET_ID");

    const { invoiceNumber, currentUser } = await req.json();

    if (!invoiceNumber) {
      return NextResponse.json(
        { ok: false, error: "Missing invoiceNumber" },
        { status: 400 }
      );
    }

    const sheets = getSheetsClient();

    // 1. Find the row index
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Invoices!B:B", // Invoice Number column
    });

    const rows = res.data.values || [];
    const rowIndex = rows.findIndex((r) => {
        const sheetVal = (r[0] || "").toString().trim();
        const searchVal = (invoiceNumber || "").toString().trim();
        return sheetVal === searchVal;
    });

    if (rowIndex === -1) {
      return NextResponse.json(
        { ok: false, error: "Invoice not found" },
        { status: 404 }
      );
    }

    const sheetDetails = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    const sheet = sheetDetails.data.sheets?.find(s => s.properties?.title === "Invoices");
    const sheetIdNum = sheet?.properties?.sheetId;

    if (sheetIdNum === undefined) {
         throw new Error("Could not find Invoices sheet ID");
    }

    await sheets.spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
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
    await deleteLineItems(sheets, sheetId, invoiceNumber);

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
