
import { getSheetsClient } from "../app/lib/sheets";

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID || "1oo7G79VtN-zIQzlpKzVHGKGDObWik7MUPdVA2ZrEayQ";

async function main() {
  console.log("Updating Settings Sheet...");
  const sheets = getSheetsClient();

  try {
     // Force update the values even if sheet exists
    

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

    console.log("Settings updated with TRN.");

  } catch (e) {
    console.error("Error:", e);
  }
}

main();
