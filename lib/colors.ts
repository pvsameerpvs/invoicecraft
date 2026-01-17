export type Palette = {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
};

// Helper to convert Hex to RGB
function hexToRgb(hex: string): { r: number, g: number, b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

// Helper to convert RGB to Hex
function rgbToHex(r: number, g: number, b: number): string {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// Simple mix function (like Sass mix)
function mix(color1: { r: number, g: number, b: number }, color2: { r: number, g: number, b: number }, weight: number) {
    const w = 2 * weight - 1;
    const a = 0; // ignoring alpha for now
    const w1 = ((w * a === -1) ? w : (w + a) / (1 + w * a) + 1) / 2;
    const w2 = 1 - w1;
    
    return {
        r: Math.round(w1 * color1.r + w2 * color2.r),
        g: Math.round(w1 * color1.g + w2 * color2.g),
        b: Math.round(w1 * color1.b + w2 * color2.b)
    };
}

export function generatePalette(baseColorHex: string): Palette {
    const base = hexToRgb(baseColorHex);
    if (!base) {
        // Fallback to black if invalid
        return {
            50: "#f8fafc", 100: "#f1f5f9", 200: "#e2e8f0", 300: "#cbd5e1", 400: "#94a3b8",
            500: "#64748b", 600: "#475569", 700: "#334155", 800: "#1e293b", 900: "#0f172a", 950: "#020617"
        };
    }

    const white = { r: 255, g: 255, b: 255 };
    const black = { r: 0, g: 0, b: 0 }; // Using a dark slate for better UI mix usually, but true black for generic mix
    
    // We can use a smarter mixing strategy to approximate Tailwind scales.
    // 500 is usually the base.
    
    return {
        50: rgbToHex(...Object.values(mix(white, base, 0.95)) as [number, number, number]),
        100: rgbToHex(...Object.values(mix(white, base, 0.9)) as [number, number, number]),
        200: rgbToHex(...Object.values(mix(white, base, 0.75)) as [number, number, number]),
        300: rgbToHex(...Object.values(mix(white, base, 0.6)) as [number, number, number]),
        400: rgbToHex(...Object.values(mix(white, base, 0.3)) as [number, number, number]),
        500: baseColorHex, // Base
        600: rgbToHex(...Object.values(mix(black, base, 0.1)) as [number, number, number]),
        700: rgbToHex(...Object.values(mix(black, base, 0.3)) as [number, number, number]),
        800: rgbToHex(...Object.values(mix(black, base, 0.5)) as [number, number, number]),
        900: rgbToHex(...Object.values(mix(black, base, 0.7)) as [number, number, number]),
        950: rgbToHex(...Object.values(mix(black, base, 0.85)) as [number, number, number]),
    };
}
