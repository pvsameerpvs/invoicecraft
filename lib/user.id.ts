import { getSheetsClient } from "@/app/lib/sheets";

/**
 * Resolves a tenant's specific Google Sheet ID from the master registry.
 * @param subdomain The subdomain extracted from the host header (e.g., 'abc')
 */
export async function getTenantSheetId(subdomain: string): Promise<string | null> {
    const masterSheetId = process.env.MASTER_SHEET_ID;
    if (!masterSheetId) {
        console.error("MASTER_SHEET_ID is not defined in environment variables.");
        return null;
    }

    try {
        console.log(`[getTenantSheetId] Fetching Companies from Master: ${masterSheetId}`);
        const sheets = getSheetsClient();
        
        // Fetch the 'Companies' sheet from the master spreadsheet
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: masterSheetId,
            range: "Companies!A1:Z500",
        });

        const rows = response.data.values;
        if (!rows || rows.length < 2) {
            console.error(`[getTenantSheetId] No data found in Companies sheet of master ${masterSheetId}`);
            return null;
        }

        const headers = rows[0];
        console.log(`[getTenantSheetId] Found headers:`, headers);
        
        // Find column indices
        const subdomainIndex = headers.findIndex(h => {
             const lower = (h || "").toLowerCase().trim();
             return lower === "c-subdomain" || lower === "subdomain";
        });
        
        const sheetIdIndex = headers.findIndex(h => {
             const lower = (h || "").toLowerCase().trim();
             return lower === "d-sheetid" || (lower.includes("sheet") && lower.includes("id"));
        });

        if (subdomainIndex === -1 || sheetIdIndex === -1) {
            console.error(`[getTenantSheetId] Column mapping failed. Subdomain index: ${subdomainIndex}, SheetID index: ${sheetIdIndex}`);
            return null;
        }

        // Search for the matching subdomain
        const tenantRow = rows.slice(1).find(row => {
            const rowSubdomain = row[subdomainIndex];
            return rowSubdomain && rowSubdomain.toLowerCase().trim() === subdomain.toLowerCase().trim();
        });

        if (!tenantRow) {
            console.log(`[getTenantSheetId] No match found for subdomain: "${subdomain}"`);
            return null;
        }

        const resolvedSheetId = tenantRow[sheetIdIndex];
        console.log(`[getTenantSheetId] Resolved "${subdomain}" to sheet: ${resolvedSheetId}`);
        return resolvedSheetId || null;

    } catch (error: any) {
        console.error("[getTenantSheetId] Error querying master sheet:", error.message);
        return null;
    }
}

/**
 * Helper to resolve the correct Sheet ID with a fallback to the default GOOGLE_SHEET_ID.
 */
export async function resolveSheetId(subdomain: string): Promise<string> {
    if (!subdomain || subdomain === "default" || subdomain === "app" || subdomain === "localhost") {
        return process.env.GOOGLE_SHEET_ID || "";
    }

    const tenantSheetId = await getTenantSheetId(subdomain);
    if (tenantSheetId) {
        return tenantSheetId;
    }

    // Fallback to default if not found
    return process.env.GOOGLE_SHEET_ID || "";
}
