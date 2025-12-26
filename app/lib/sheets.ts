import { google } from "googleapis";
import { GoogleAuth } from "google-auth-library";

// SHARED CONSTANTS
const SHEET_ID = "1oo7G79VtN-zIQzlpKzVHGKGDObWik7MUPdVA2ZrEayQ";

export function getSheetsClient() {
  // HARDCODED CREDENTIALS - WARNING: THIS EXPOSES SECRETS IN GIT
  const clientEmail = "justsearch-tax-invoice@just-search-scrapper.iam.gserviceaccount.com";
  const privateKeyRaw = `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCgWs+uVhh5c2RB
waAvdzmVyOaPwhZcLX2UvLrEfElPfIHVTFogRYqeg92WFtmMoNhxkW50kgT9B7IQ
bH8Qug1f3z0C/YN6Fx4ZOhW6+lShGYIP8/3CUD5UyHv0/AajjJI3044OcBYCjJ33
jBgUa66tiJtyDLKPTmdkee6kc6kTbeYNBwxqwL9on/5Rfh8SshFaiAZqDY9l0hGo
UkGiYgVan4MynTW7Vp6PokKO2FaP5GyPoJJMucxt24dWeJ9QggqS89iVILFz1Y9R
DKc20RbWcWzlHRIQ3TpWoFwVd/MdcoD4wEHe0VRnH13FLGFPKno4QEcTG0hUHVSP
EEXTKsUZAgMBAAECggEASOY/+D/HzJ76+zHtguau1TuKJdzUkX9U0iOivOTL50jx
NWkKqBU1Wa8VM8CbkmUlQSwejPw9LFMtTm4krhQHNIimkg9ykDSmSE2xx1k61Cpm
iJ4hxQ75501lnRBebEfhyWNx93pZZztKLVoRMGdr+BRcptLC8odwVathJH44ZU4d
zM77TxhBjhAeVKrKW0c68GK9S8+HEIcaej8qQ20/2s8LZxV0V9Tos8YCiAtAtcOD
Bqh/yQ1sRGKI+8f3K+oFss5AmB/b0/8vNCm5tAhZnGuK5kLdeoZUT6bhYz6RF6Q2
g6KIFnSxreU/3EFzlIVBxSewp0SS4VYEp83E/Ljg6QKBgQDgrzI48ncMDsq0UWs+
1jSKrRVI5pDXOZX7ZAOveabchtYQKHGj96tb1VMZmn3AWJwxLLyB8cGrq+Q6NiMG
oLL/iLNsMnX2CCcfwW5wVInDyGcyN/9E9ogH/kRmnbIVkRssxW/izdysH5xl/5QO
GQqqyN59F9j5Qo94BgVFhCMylwKBgQC2tFCoYyMmWRRweFKJTGgp5ptvslwhOOGV
eSuG6k2qOjMmg+qMKxNX9k/cp3RORa5WJDAnXpW3mzmSHrpgVtnFCi7vPlFE5jMK
ICIS0LuMIrzRcGNH8bFVa1IjMfgcSaLfEjCrA5RNP0FF4WN3Zw8as0zpSKGLhmb0
mGtq5qarzwKBgD8x551OzR8OFgNrlw+AbhzHG+J6PyjZ4I5pjgPP4pfKMPEwfu4Q
XhkhQhNEebQc+Cl4nLirx75CRZn92hImJtJqn5SCCN2fY2myHR7pGCqB9kyQpXK/
KHmfEZwPJKSeQJdyHMsc/cFHztR9cyYX8wEgKDvk9jj9eJ7YiqkHxmKXAoGAA5fu
UjGI+nMcFM45CVxIXDKd8gd3Cmw8+5yjf4bSOjvkz6gej901BzDgBz3/6p4yPJ1/
mPaiSTczXa1fCxAKPnbhz3DRVmKUtGlHYklatvnj7tagDUUysLRorCqKb7v/CRYp
gOOUIiTRWteBBlMvl93Y8GmuS7k8AymQS0z4ED8CgYB/Jqh+PWb7QGgWj4E+g2/C
XL4PfJVyLZFoCuikUeGVu9zmU+L5SUZoIrh5RY8dvf8Xe1e4NYQTCq1oZ2kQuQGJ
lq3geHYTD6EK2i38ZYfEtCfdwtfmgs302S83aq5323j4QIVtd+JRcYnnx63b+tki
qOJsHij3DuS+iS8XqNkTNQ==
-----END PRIVATE KEY-----`;

  if (!clientEmail || !privateKeyRaw) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY");
  }

  try {
    const auth = new GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKeyRaw.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    return google.sheets({ version: "v4", auth });
  } catch (error: any) {
    throw new Error(`Failed to initialize Google Sheets client: ${error.message}`);
  }
}

export async function logActivity(username: string, action: string, userAgent: string | null) {
  try {
    const sheets = getSheetsClient();
    const timestamp = new Date().toISOString();
    
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: "Activity!A:D", // Columns: Timestamp, Username, Action, Device
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          [
            timestamp,
            username,
            action,
            userAgent || "Unknown"
          ]
        ]
      }
    });
  } catch (e) {
    console.error("Failed to log activity:", e);
    // Don't throw, logging failure shouldn't block the user action
  }
}
