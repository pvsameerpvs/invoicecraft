/**
 * Represents the configuration for a specific business billing model.
 */
export interface BusinessProfileConfig {
    id: "Product" | "Service" | "Hourly" | "Project" | "Recurring";
    label: string;
    catalogTitle: string; 
    fields: {
        descLabel: string;
        qtyLabel: string;
        priceLabel: string;
    };
    headers: {
        no: string;      // Column 1 (Index)
        desc: string;    // Column 2 (Detailed description)
        qty: string;     // Column 3 (Quantity/Units/Hours)
        price: string;   // Column 4 (Unit Price/Rate)
        total: string;   // Column 5 (Line Total)
    };
}

export const BUSINESS_PROFILES: Record<string, BusinessProfileConfig> = {
    "Product": {
        id: "Product",
        label: "Item / Product-based",
        catalogTitle: "Product Catalog",
        fields: {
            descLabel: "Product Name",
            qtyLabel: "Quantity",
            priceLabel: "Unit Price"
        },
        headers: {
            no: "Item No.",
            desc: "Description",
            qty: "Qty",
            price: "Unit Price",
            total: "Total"
        }
    },
    "Service": {
        id: "Service",
        label: "Service-based",
        catalogTitle: "Service Catalog",
        fields: {
            descLabel: "Service Name",
            qtyLabel: "Quantity",
            priceLabel: "Fee"
        },
        headers: {
            no: "No.",
            desc: "Service Description",
            qty: "Units",
            price: "Price",
            total: "Total"
        }
    },
    "Hourly": {
        id: "Hourly",
        label: "Hourly / Time-based",
        catalogTitle: "Hourly Rate Catalog",
        fields: {
            descLabel: "Task Name",
            qtyLabel: "Hours",
            priceLabel: "Hourly Rate"
        },
        headers: {
            no: "Sl No.",
            desc: "Description",
            qty: "Hours",
            price: "Rate",
            total: "Total"
        }
    },
    "Project": {
        id: "Project",
        label: "Project / Lump-sum",
        catalogTitle: "Project Deliverables",
        fields: {
            descLabel: "Deliverable Name",
            qtyLabel: "Weight / Percentage",
            priceLabel: "Amount"
        },
        headers: {
            no: "Phase",
            desc: "Project Deliverable",
            qty: "%",
            price: "Lump Sum",
            total: "Total"
        }
    },
    "Recurring": {
        id: "Recurring",
        label: "Recurring / Contract-based",
        catalogTitle: "Subscription Catalog",
        fields: {
            descLabel: "Contract Item",
            qtyLabel: "Period",
            priceLabel: "Periodic Fee"
        },
        headers: {
            no: "No.",
            desc: "Contract Item",
            qty: "Period",
            price: "Fee",
            total: "Total"
        }
    }
};

/**
 * Standardized helper to get business profile configuration with fallback.
 */
export function getBusinessProfile(id?: string): BusinessProfileConfig {
    return BUSINESS_PROFILES[id || "Product"] || BUSINESS_PROFILES["Product"];
}
