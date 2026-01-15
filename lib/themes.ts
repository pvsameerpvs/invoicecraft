// Full Tailwind Colors for mapping
const palettes = {
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
    }
};

export type ThemeId = "orange" | "blue" | "purple" | "green" | "teal";

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
    }
];
