import { getSheetsClient } from "./sheets";

export interface User {
  id: string;
  username: string;
  role: "admin" | "user";
  email: string;
  mobile: string;
}

const USERS_SHEET_ID = "1oo7G79VtN-zIQzlpKzVHGKGDObWik7MUPdVA2ZrEayQ"; // Same sheet ID

export async function verifyUser(username: string, password: string): Promise<User | null> {
  console.log(`[Auth] Verifying user: ${username}`);
  try {
    const sheets = getSheetsClient();
    console.log(`[Auth] Client initialized. Fetching from ${USERS_SHEET_ID}...`);
    
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: USERS_SHEET_ID,
      range: "Users!A2:F", 
    });

    console.log(`[Auth] Fetch complete. Status: ${res.status}`);
    const rows = res.data.values || [];
    console.log(`[Auth] Found ${rows.length} users.`);

    // Row: [ID, Username, Password, Role, Email, Mobile]
    const userRow = rows.find(
      (row) => row[1] === username && row[2] === password
    );

    if (!userRow) {
      console.log(`[Auth] No matching user found for ${username}`);
      return null;
    }

    console.log(`[Auth] User verified: ${userRow[1]} (${userRow[3]})`);

    return {
      id: userRow[0] || "",
      username: userRow[1] || "",
      role: (userRow[3] as "admin" | "user") || "user",
      email: userRow[4] || "",
      mobile: userRow[5] || "",
    };
  } catch (error: any) {
    console.error("[Auth] Verification Error:", error.message);
    if (error.message.includes("403")) {
        console.error("PERMISSION DENIED: Did you share the sheet with the service account?");
    }
    if (error.message.includes("404") || error.message.includes("NOT_FOUND")) {
        console.error("SHEET NOT FOUND: Did you create the 'Users' tab or use a new Sheet ID?");
    }
    return null;
  }
}

export async function getUser(username: string): Promise<User | null> {
    try {
        const sheets = getSheetsClient();
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: USERS_SHEET_ID,
            range: "Users!A2:F",
        });
        const rows = res.data.values || [];
        const userRow = rows.find((row) => row[1] === username);

        if (!userRow) return null;

        return {
            id: userRow[0] || "",
            username: userRow[1] || "",
            role: (userRow[3] as "admin" | "user") || "user",
            email: userRow[4] || "",
            mobile: userRow[5] || "",
        };
    } catch (error) {
        console.error("Failed to get user:", error);
        return null;
    }
}
