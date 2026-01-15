export type ThemeId = "orange" | "blue" | "purple" | "green" | "teal";

export interface Theme {
    id: ThemeId;
    label: string;
    colors: {
        start: string;
        end: string;
        primary: string;
    }
}

export const themes: Theme[] = [
    {
        id: "orange",
        label: "Sunrise Orange",
        colors: {
            start: "#F09819",
            end: "#FF512F",
            primary: "#FF6B35",
        }
    },
    {
        id: "blue",
        label: "Ocean Blue",
        colors: {
            start: "#24C6DC",
            end: "#514A9D",
            primary: "#2563EB",
        }
    },
    {
        id: "purple",
        label: "Royal Purple",
        colors: {
            start: "#da22ff",
            end: "#9733ee",
            primary: "#9333EA",
        }
    },
     {
        id: "green",
        label: "Forest Green",
        colors: {
            start: "#11998e",
            end: "#38ef7d",
            primary: "#16a34a",
        }
    },
    {
        id: "teal",
        label: "Modern Teal",
        colors: {
            start: "#00c6ff",
            end: "#0072ff",
            primary: "#06b6d4",
        }
    }
];
