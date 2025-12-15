import { NextResponse } from "next/server";
import { google } from "googleapis";
import { GoogleAuth } from "google-auth-library";
import serviceAccount from "../service-account.json";

export const runtime = "nodejs";

function money(n: number) {
  if (!Number.isFinite(n)) return "0.00";
  return n.toFixed(2);
}

function getSheetsClient() {
  const { client_email: clientEmail, private_key: privateKeyRaw } = serviceAccount;
  console.info("clientEmail", clientEmail);
  console.info("privateKeyRaw", privateKeyRaw);

  if (!clientEmail || !privateKeyRaw) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY");
  }

  let privateKey: string;

  try {
    // ✅ Check if the key is Base64 encoded (no PEM headers)
    // if (!privateKeyRaw.includes("BEGIN PRIVATE KEY")) {
    //   // Assume it's Base64 encoded, decode it
    //   privateKey = Buffer.from(privateKeyRaw, "base64").toString("utf-8");
    // } else {
    //   // Handle escaped newlines, remove carriage returns, and trim whitespace
    //   privateKey = privateKeyRaw
    //     .replace(/\\n/g, "\n")  // Convert literal \n to actual newlines
    //     .replace(/\r/g, "")      // Remove any carriage returns
    //     .trim();

    //   // Ensure proper PEM format with newlines after header/footer
    //   if (!privateKey.includes("\n")) {
    //     privateKey = privateKey
    //       .replace("-----BEGIN PRIVATE KEY-----", "-----BEGIN PRIVATE KEY-----\n")
    //       .replace("-----END PRIVATE KEY-----", "\n-----END PRIVATE KEY-----");
    //   }
    // }

    // const auth = new google.auth.JWT({
    //   email: clientEmail,
    //   key: privateKeyRaw.replace(/\\n/g, '\n'),
    //   scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    // });

    const auth = new GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKeyRaw,
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    return google.sheets({ version: "v4", auth });
  } catch (error: any) {
    throw new Error(`Failed to initialize Google Sheets client: ${error.message}`);
  }
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
