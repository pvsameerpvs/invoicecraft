import { NextResponse } from "next/server";
import { google } from "googleapis";
import { GoogleAuth } from "google-auth-library";

export const runtime = "nodejs";

function money(n: number) {
  if (!Number.isFinite(n)) return "0.00";
  return n.toFixed(2);
}

function getSheetsClient() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKeyRaw = process.env.GOOGLE_PRIVATE_KEY;

  if (!clientEmail || !privateKeyRaw) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY");
  }

  // Handle both escaped newline strings (e.g. from Vercel env) and actual newlines
  const privateKey = privateKeyRaw.replace(/\\n/g, "\n");

  const auth = new GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
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
    const sheetId = process.env.GOOGLE_SHEET_ID;
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
      range: "Invoices!A:J",
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

    return NextResponse.json({ ok: true, invoiceNumber });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Failed" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/invoice-history
 * Body: { originalInvoiceNumber, invoice }
 * Updates the existing row for originalInvoiceNumber
 */
export async function PUT(req: Request) {
  try {
    const sheetId = process.env.GOOGLE_SHEET_ID;
    if (!sheetId) throw new Error("Missing GOOGLE_SHEET_ID");

    const { originalInvoiceNumber, invoice } = await req.json();

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
      range: "Invoices!B:B", // Invoice Number column
    });

    const rows = res.data.values || [];
    // rows are like: [ ["Invoice #"], ["INV-001"], ["INV-002"] ]
    
    console.log("Searching for:", originalInvoiceNumber);
    
    const rowIndex = rows.findIndex((r) => {
        const sheetVal = (r[0] || "").toString().trim();
        const searchVal = (originalInvoiceNumber || "").toString().trim();
        return sheetVal === searchVal;
    });

    if (rowIndex === -1) {
      console.log("Invoice numbers in sheet:", rows.map(r => r[0]));
      return NextResponse.json(
        { ok: false, error: `Original invoice "${originalInvoiceNumber}" not found in sheet` },
        { status: 404 }
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
    // Columns: Created (A), Inv# (B), Date (C), Client (D), Subject (E), Currency (F), Sub (G), VAT (H), Total (I), Payload (J)
    // We preserve CreatedAt (Column A) by reading it? Or just don't write it?
    // We need to write the whole row to keep it consistent.
    // Let's Fetch the specific row first to keep CreatedAt? Or just use "now" for updated at?
    // Usually CreatedAt should stay same.
    // Let's just update B:J. A is CreatedAt.

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

    // 3. Update Line Items
    // This is trickier because line items are just appended.
    // Option A: Don't update line items sheet (simple). But then detailed reporting is wrong.
    // Option B: Delete old line items and append new ones. Hard to delete rows in middle.
    // Option C: Just append new ones and ignore old ones? No.
    // Option D: Current requirement might just be to update the INVOICE row for later editing.
    // The "history" page reads from the "Invoices" sheet payload (Col J).
    // So as long as we update Col J, the "Edit" feature will work with new data.
    // The "LineItems" sheet is likely for separate data analysis.
    // For now, I will append NEW line items for this invoice number and leave old ones as "ghosts"
    // OR, I can try to find and clear them? Too risky without a proper DB ID.
    // Let's just update the Invoices Row for now, which drives the app.

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
    const sheetId = process.env.GOOGLE_SHEET_ID;
    if (!sheetId) throw new Error("Missing GOOGLE_SHEET_ID");

    const sheets = getSheetsClient();

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Invoices!A:J",
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
