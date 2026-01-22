import { getSheetsClient } from "./sheets";
import { comparePassword } from "@/lib/password";

export interface User {
  id: string;
  username: string;
  role: "admin" | "user";
  email: string;
  mobile: string;
  createdAt?: string;
}


export async function verifyUser(SHEET_ID: string, username: string, password: string): Promise<User | null> {
  console.log(`[Auth] Verifying user: ${username} in sheet ${SHEET_ID}`);
  try {
    const sheets = getSheetsClient();
    
    // Fetch row 1 to discovery headers and up to row 100 for data
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "Users!A1:Z100", 
    });

    const rows = res.data.values || [];
    if (rows.length < 2) {
      console.error(`[Auth] No data found in 'Users' tab of sheet ${SHEET_ID}`);
      return null;
    }

    // discovery headers (case-insensitive, trimmed)
    const headers = rows[0].map((h: any) => (h || "").toString().toLowerCase().trim());
    const usernameIdx = headers.findIndex(h => h === "username" || h === "user");
    const passwordIdx = headers.findIndex(h => h === "password" || h === "pass");
    const roleIdx = headers.findIndex(h => h === "role");
    const idIdx = headers.findIndex(h => h === "id");
    const emailIdx = headers.findIndex(h => h === "email");
    const mobileIdx = headers.findIndex(h => h === "mobile" || h === "phone");
    const dateIdx = headers.findIndex(h => h === "createdat" || h === "date");

    if (usernameIdx === -1 || passwordIdx === -1) {
      console.error(`[Auth] Schema Mismatch! Could not find 'Username' or 'Password' columns. Headers found:`, headers);
      return null;
    }

    // Find the user row
    const userRow = rows.slice(1).find((row) => 
      (row[usernameIdx] || "").toString().toLowerCase().trim() === username.toLowerCase().trim()
    );

    if (!userRow) {
      console.log(`[Auth] User '${username}' not found in any row.`);
      return null;
    }

    // Get the stored password/hash and TRIM it
    const storedPassword = (userRow[passwordIdx] || "").toString().trim();
    
    // Check if it's a bcrypt hash (starts with $2 and has salt rounds)
    const isHash = storedPassword.startsWith("$2a$") || storedPassword.startsWith("$2b$") || storedPassword.startsWith("$2y$");
    
    let passwordMatch = false;
    if (isHash) {
      console.log(`[Auth] Comparing bcrypt hash for user: ${username}`);
      passwordMatch = await comparePassword(password, storedPassword);
    } else {
      console.log(`[Auth] Comparing plain text for user: ${username} (Migration Mode)`);
      passwordMatch = password === storedPassword;
    }

    if (!passwordMatch) {
      console.log(`[Auth] Password mismatch for user: ${username}`);
      return null;
    }

    console.log(`[Auth] Login successful: ${userRow[usernameIdx]}`);

    return {
      id: idIdx !== -1 ? userRow[idIdx] || "" : "",
      username: userRow[usernameIdx] || "",
      role: roleIdx !== -1 ? (userRow[roleIdx] as "admin" | "user") || "user" : "user",
      email: emailIdx !== -1 ? userRow[emailIdx] || "" : "",
      mobile: mobileIdx !== -1 ? userRow[mobileIdx] || "" : "",
      createdAt: dateIdx !== -1 ? userRow[dateIdx] || "" : "",
    };
  } catch (error: any) {
    console.error("[Auth] Google Sheets Error:", error.message);
    if (error.message.includes("403")) {
      console.error("CRITICAL: Permission Denied. Share the sheet with: justsearch-tax-invoice@just-search-scrapper.iam.gserviceaccount.com");
    }
    return null;
  }
}

export async function getUser(SHEET_ID: string, username: string): Promise<User | null> {
    try {
        if (!SHEET_ID) return null;
        const sheets = getSheetsClient();
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: "Users!A1:Z100",
        });
        const rows = res.data.values || [];
        if (rows.length < 2) return null;

        const headers = rows[0].map((h: any) => (h || "").toString().toLowerCase().trim());
        const usernameIdx = headers.findIndex(h => h === "username" || h === "user");
        
        if (usernameIdx === -1) return null;

        const userRow = rows.slice(1).find((row) => 
            (row[usernameIdx] || "").toString().toLowerCase().trim() === username.toLowerCase().trim()
        );

        if (!userRow) return null;

        const roleIdx = headers.findIndex(h => h === "role");
        const idIdx = headers.findIndex(h => h === "id");
        const emailIdx = headers.findIndex(h => h === "email");
        const mobileIdx = headers.findIndex(h => h === "mobile" || h === "phone");
        const dateIdx = headers.findIndex(h => h === "createdat" || h === "date");

        return {
            id: idIdx !== -1 ? userRow[idIdx] || "" : "",
            username: userRow[usernameIdx] || "",
            role: roleIdx !== -1 ? (userRow[roleIdx] as "admin" | "user") || "user" : "user",
            email: emailIdx !== -1 ? userRow[emailIdx] || "" : "",
            mobile: mobileIdx !== -1 ? userRow[mobileIdx] || "" : "",
            createdAt: dateIdx !== -1 ? userRow[dateIdx] || "" : "",
        };
    } catch (error) {
        console.error("Failed to get user:", error);
        return null;
    }
}
