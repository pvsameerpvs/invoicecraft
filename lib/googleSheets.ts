import { google } from "googleapis";


function getServiceAccountFromBase64() {
  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64;
  if (!b64) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON_BASE64");

  const jsonStr = Buffer.from(b64, "base64").toString("utf8");
  const creds = JSON.parse(jsonStr);

  if (!creds.client_email || !creds.private_key) {
    throw new Error("Invalid service account JSON (missing client_email/private_key)");
  }

  return {
    clientEmail: creds.client_email as string,
    privateKey: (creds.private_key as string).replace(/\\n/g, "\n"),
  };
}

export async function getSheetsClient() {
  const { clientEmail, privateKey } = getServiceAccountFromBase64();

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  await auth.authorize();
  return google.sheets({ version: "v4", auth });
}
