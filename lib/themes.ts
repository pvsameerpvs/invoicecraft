// Full Tailwind Colors for mapping
const palettes = {
    // Standard
    orange: {
        50: "#fff7ed", 100: "#ffedd5", 200: "#fed7aa", 300: "#fdba74", 400: "#fb923c",
        500: "#f97316", 600: "#ea580c", 700: "#c2410c", 800: "#9a3412", 900: "#7c2d12", 950: "#431407"
    },
    blue: {
        50: "#eff6ff", 100: "#dbeafe", 200: "#bfdbfe", 300: "#93c5fd", 400: "#60a5fa",
        500: "#3b82f6", 600: "#2563eb", 700: "#1d4ed8", 800: "#1e40af", 900: "#1e3a8a", 950: "#172554"
    },
    purple: {
        50: "#faf5ff", 100: "#f3e8ff", 200: "#e9d5ff", 300: "#d8b4fe", 400: "#c084fc",
        500: "#a855f7", 600: "#9333ea", 700: "#7e22ce", 800: "#6b21a8", 900: "#581c87", 950: "#3b0764"
    },
    green: {
        50: "#f0fdf4", 100: "#dcfce7", 200: "#bbf7d0", 300: "#86efac", 400: "#4ade80",
        500: "#22c55e", 600: "#16a34a", 700: "#15803d", 800: "#166534", 900: "#14532d", 950: "#052e16"
    },
    teal: {
        50: "#f0f9ff", 100: "#e0f2fe", 200: "#bae6fd", 300: "#7dd3fc", 400: "#38bdf8",
        500: "#0ea5e9", 600: "#0284c7", 700: "#0369a1", 800: "#075985", 900: "#0c4a6e", 950: "#082f49"
    },
    // New / Refined
    black: {
        50: "#f8fafc", 100: "#f1f5f9", 200: "#e2e8f0", 300: "#cbd5e1", 400: "#94a3b8",
        500: "#64748b", 600: "#475569", 700: "#334155", 800: "#1e293b", 900: "#0f172a", 950: "#020617"
    },
    gold: {
        50: "#fffbeb", 100: "#fef3c7", 200: "#fde68a", 300: "#fcd34d", 400: "#fbbf24",
        500: "#f59e0b", 600: "#d97706", 700: "#b45309", 800: "#92400e", 900: "#78350f", 950: "#451a03"
    },
    rose: {
        50: "#fff1f2", 100: "#ffe4e6", 200: "#fecdd3", 300: "#fda4af", 400: "#fb7185",
        500: "#f43f5e", 600: "#e11d48", 700: "#be123c", 800: "#9f1239", 900: "#881337", 950: "#4c0519"
    },
    lavender: {
        50: "#f5f3ff", 100: "#ede9fe", 200: "#ddd6fe", 300: "#c4b5fd", 400: "#a78bfa",
        500: "#8b5cf6", 600: "#7c3aed", 700: "#6d28d9", 800: "#5b21b6", 900: "#4c1d95", 950: "#2e1065"
    }
};

export type ThemeId = "orange" | "blue" | "purple" | "green" | "teal" | "black" | "gold" | "rose" | "lavender";

export interface Theme {
    id: ThemeId;
    label: string;
    colors: {
        start: string;
        end: string;
        primary: string;
        // Expanded Palette
        50: string; 100: string; 200: string; 300: string; 400: string;
        500: string; 600: string; 700: string; 800: string; 900: string; 950: string;
    }
}

export const themes: Theme[] = [
    {
        id: "orange",
        label: "Sunrise Orange",
        colors: {
            start: "#F09819", end: "#FF512F", primary: "#FF6B35",
            ...palettes.orange
        }
    },
    {
        id: "blue",
        label: "Ocean Blue",
        colors: {
            start: "#24C6DC", end: "#514A9D", primary: "#2563EB",
            ...palettes.blue
        }
    },
    {
        id: "purple",
        label: "Royal Purple",
        colors: {
            start: "#da22ff", end: "#9733ee", primary: "#9333EA",
            ...palettes.purple
        }
    },
     {
        id: "green",
        label: "Forest Green",
        colors: {
            start: "#11998e", end: "#38ef7d", primary: "#16a34a",
            ...palettes.green
        }
    },
    {
        id: "teal",
        label: "Modern Teal",
        colors: {
            start: "#00c6ff", end: "#0072ff", primary: "#06b6d4",
            ...palettes.teal
        }
    },
    // New Premium Themes
    {
        id: "black",
        label: "Midnight Black",
        colors: {
            start: "#434343", end: "#000000", primary: "#0f172a",
            ...palettes.black
        }
    },
    {
        id: "gold",
        label: "Luxury Gold",
        colors: {
            start: "#f2994a", end: "#f2c94c", primary: "#b45309",
            ...palettes.gold
        }
    },
    {
        id: "rose",
        label: "Dusty Rose",
        colors: {
            start: "#ff758c", end: "#ff7eb3", primary: "#e11d48",
            ...palettes.rose
        }
    },
     {
        id: "lavender",
        label: "Soft Lavender",
        colors: {
            start: "#a18cd1", end: "#fbc2eb", primary: "#6d28d9",
            ...palettes.lavender
        }
    }
];
