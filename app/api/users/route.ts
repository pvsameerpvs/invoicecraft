import { NextResponse } from "next/server";
import { getSheetsClient, logActivity } from "../../lib/sheets";
import { verifyUser, getUser } from "@/app/lib/auth";
import { cookies } from "next/headers";

const USERS_SHEET_ID = "1oo7G79VtN-zIQzlpKzVHGKGDObWik7MUPdVA2ZrEayQ";

// GET: Get current user details
export async function GET(req: Request) {
    try {
        const username = cookies().get("invoicecraft_auth")?.value;
        if (!username) {
            return NextResponse.json({ ok: false, error: "Not logged in" }, { status: 401 });
        }
        
        const user = await getUser(username);
        
        if (!user) {
             return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
        }

        // Return safe user data
        return NextResponse.json({ 
            ok: true, 
            user: {
                username: user.username,
                role: user.role,
                email: user.email,
                mobile: user.mobile,
                createdAt: user.createdAt
            } 
        });

    } catch (e: any) {
        return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
    }
}

// POST: Create a new user
export async function POST(req: Request) {
    try {
        // Security Check: Only admins can create users
        const role = cookies().get("invoicecraft_role")?.value;
        if (role !== "admin") {
            return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 403 });
        }

        const { username, password, role: newRole, email, mobile } = await req.json();

        if (!username || !password) {
             return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
        }

        const sheets = getSheetsClient();

        // Check if user exists
        const existing = await sheets.spreadsheets.values.get({
            spreadsheetId: USERS_SHEET_ID,
            range: "Users!B:B",
        });

        const users = (existing.data.values || []).flat();
        if (users.includes(username)) {
            return NextResponse.json({ ok: false, error: "Username already taken" }, { status: 409 });
        }

        // Add User
        // ID, Username, Password, Role, Email, Mobile
        const id = Date.now().toString(); 
        const createdAt = new Date().toISOString();
        // ID, Username, Password, Role, Email, Mobile, CreatedAt
        await sheets.spreadsheets.values.append({
            spreadsheetId: USERS_SHEET_ID,
            range: "Users!A:G",
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values: [[id, username, password, newRole, email || "", mobile || "", createdAt]] 
            }
        });

        // Log
        const currentUser = cookies().get("invoicecraft_auth")?.value || "admin";
        await logActivity(currentUser, `CREATED USER ${username}`, req.headers.get("user-agent"));

        return NextResponse.json({ ok: true });
    } catch (e: any) {
        return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
    }
}

// PUT: Update current user details
// PUT: Update current user details
export async function PUT(req: Request) {
    try {
        const currentUser = cookies().get("invoicecraft_auth")?.value;
        if (!currentUser) {
             return NextResponse.json({ ok: false, error: "Not logged in" }, { status: 401 });
        }

        const { email, mobile, password, username: newUsername } = await req.json();

        const sheets = getSheetsClient();

        // Fetch all users to check for existence and find current user
        const existing = await sheets.spreadsheets.values.get({
            spreadsheetId: USERS_SHEET_ID,
            range: "Users!B:B", // Username column
        });

        const users = (existing.data.values || []).flat(); // List of usernames
        const rowIndex = users.findIndex(u => u === currentUser);

        if (rowIndex === -1) {
             return NextResponse.json({ ok: false, error: "User record not found" }, { status: 404 });
        }

        // B:B includes header at index 0. So row # is index + 1
        const rowNum = rowIndex + 1; 
        
        // 0. Update Username if provided (Column B)
        if (newUsername && newUsername !== currentUser) {
             if (users.includes(newUsername)) {
                 return NextResponse.json({ ok: false, error: "Username already taken" }, { status: 409 });
             }
             
             await sheets.spreadsheets.values.update({
                spreadsheetId: USERS_SHEET_ID,
                range: `Users!B${rowNum}`,
                valueInputOption: "USER_ENTERED",
                requestBody: { values: [[newUsername]] }
             });
             
             // Update Auth Cookie because username changed
             // We need to set the cookie on the response
             // But in Next.js App Router we can set cookies on the request or response.
             // We return JSON, so we can't easily set header on NextResponse unless we construct it specifically.
             // Actually, we can just set it on the response object we return.
        }
        
        // 1. Update Password if provided (Column C)
        if (password) {
             await sheets.spreadsheets.values.update({
                spreadsheetId: USERS_SHEET_ID,
                range: `Users!C${rowNum}`,
                valueInputOption: "USER_ENTERED",
                requestBody: { values: [[password]] }
           });
        }

        // 2. Update Email/Mobile if provided (Column E, F)
        if (email !== undefined || mobile !== undefined) {
             if (email !== undefined && mobile !== undefined) {
                await sheets.spreadsheets.values.update({
                    spreadsheetId: USERS_SHEET_ID,
                    range: `Users!E${rowNum}:F${rowNum}`,
                    valueInputOption: "USER_ENTERED",
                    requestBody: {
                        values: [[email, mobile]]
                    }
                });
             }
        }

        // Log
        await logActivity(currentUser, `UPDATED PROFILE${newUsername ? ` (New User: ${newUsername})` : ""}`, req.headers.get("user-agent"));

        const response = NextResponse.json({ ok: true });
        
        // If username changed, update cookie
        if (newUsername && newUsername !== currentUser) {
             response.cookies.set("invoicecraft_auth", newUsername, { 
                 path: "/",
                 httpOnly: true,
                 secure: process.env.NODE_ENV === "production",
                 maxAge: 60 * 60 * 24 * 7 // 7 days
             });
        }

        return response;

    } catch (e: any) {
        return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
    }
}
// DELETE: Delete a user
export async function DELETE(req: Request) {
    try {
        // Security Check: Only admins can delete users
        const role = cookies().get("invoicecraft_role")?.value;
        if (role !== "admin") {
            return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 403 });
        }

        const { username } = await req.json();

        if (!username) {
             return NextResponse.json({ ok: false, error: "Missing username" }, { status: 400 });
        }

        // Prevent deleting self
        const currentUser = cookies().get("invoicecraft_auth")?.value;
        if (username === currentUser) {
            return NextResponse.json({ ok: false, error: "Cannot delete yourself" }, { status: 400 });
        }

        const sheets = getSheetsClient();

        // Find user row index
        const existing = await sheets.spreadsheets.values.get({
            spreadsheetId: USERS_SHEET_ID,
            range: "Users!B:B", // Username column
        });

        const users = (existing.data.values || []).flat();
        const rowIndex = users.findIndex(u => u === username);

        if (rowIndex === -1) {
             return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
        }

        const sheetId = 0; // Assuming Users is the first sheet (GID 0). If not, we need to find sheetId.
        // Actually, deleting rows requires the numeric SheetId (GID), not the name.
        // We can fetch the spreadsheet metadata to find the GID for "Users".
        
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: USERS_SHEET_ID
        });

        const sheet = spreadsheet.data.sheets?.find(s => s.properties?.title === "Users");
        if (!sheet?.properties?.sheetId && sheet?.properties?.sheetId !== 0) {
            throw new Error("Could not find Users sheet ID");
        }
        const userSheetId = sheet.properties.sheetId!;

        // Row index in array is 0-based relative to the data range.
        // If B:B includes header, index 0 is header.
        // batchUpdate deleteDimension uses 0-based index.
        // If rowIndex 0 is "Username" header, we definitely don't want to delete that.
        // But findIndex returns index in the array.
        // matches 'username' which shouldn't match header 'Username' unless case issue?
        // Assuming strict match.

        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: USERS_SHEET_ID,
            requestBody: {
                requests: [
                    {
                        deleteDimension: {
                            range: {
                                sheetId: userSheetId,
                                dimension: "ROWS",
                                startIndex: rowIndex, 
                                endIndex: rowIndex + 1 
                            }
                        }
                    }
                ]
            }
        });

        // Log
        await logActivity(currentUser || "admin", `DELETED USER ${username}`, req.headers.get("user-agent"));

        return NextResponse.json({ ok: true });
    } catch (e: any) {
        return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
    }
}
