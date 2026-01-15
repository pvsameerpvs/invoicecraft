
import { getSheetsClient } from "../app/lib/sheets";

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID || "1oo7G79VtN-zIQzlpKzVHGKGDObWik7MUPdVA2ZrEayQ";

async function main() {
  console.log("Initializing Settings Sheet...");
  const sheets = getSheetsClient();

  try {
    // 1. Check if sheet exists
    const meta = await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID
    });

    const exists = meta.data.sheets?.find(s => s.properties?.title === "Settings");
    if (exists) {
        console.log("Settings sheet already exists.");
        return;
    }

    // 2. Create Sheet
    await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
            requests: [
                {
                    addSheet: {
                        properties: {
                            title: "Settings",
                            gridProperties: {
                                frozenRowCount: 1
                            }
                        }
                    }
                }
            ]
        }
    });

    console.log("Settings sheet created.");

    // 3. Add Header Row & Default Values
    // Columns: 
    // A: CompanyName
    // B: CompanyAddress
    // C: BankCompanyName
    // D: BankName
    // E: BankLabel
    // F: AccountNumber
    // G: AccountIban
    // H: FooterNote
    // I: SignatureLabel
    // J: Currency
    // K: CompanyTrn
    
    // Default values from current InvoiceEditorContainer.tsx
   

    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: "Settings!A1:K2",
        valueInputOption: "USER_ENTERED",
        requestBody: {
            values: [
                ["CompanyName", "CompanyAddress", "BankCompanyName", "BankName", "BankLabel", "AccountNumber", "AccountIban", "FooterNote", "SignatureLabel", "Currency", "CompanyTrn"],
               
            ]
        }
    });

    console.log("Settings initialized with default values.");

  } catch (e) {
    console.error("Error:", e);
  }
}

main();
