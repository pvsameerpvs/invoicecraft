"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { ThemeId, themes } from "@/lib/themes";

interface ThemeContextType {
    currentTheme: ThemeId;
    logoUrl: string | undefined;
    setTheme: (id: ThemeId) => void;
    setLogoUrl: (url: string) => void;
    refreshSettings: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [currentTheme, setCurrentTheme] = useState<ThemeId>("orange");
    const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);
    const [mounted, setMounted] = useState(false);

    const applyTheme = (themeId: ThemeId) => {
        const theme = themes.find(t => t.id === themeId) || themes[0];
        
        const root = document.documentElement;
        root.style.setProperty("--color-brand-start", theme.colors.start);
        root.style.setProperty("--color-brand-end", theme.colors.end);
        root.style.setProperty("--color-brand-primary", theme.colors.primary);
        
        // Also simpler hex for imperative usage if needed
        setCurrentTheme(themeId);
    };

    const refreshSettings = async () => {
        try {
            // Using a simple cache bust/timestamp if needed, but for now standard fetch
            const res = await fetch("/api/settings?t=" + Date.now());
            const data = await res.json();
            
            if (data && !data.error) {
                if (data.Theme) {
                    applyTheme(data.Theme as ThemeId);
                }
                if (data.LogoUrl) {
                    setLogoUrl(data.LogoUrl);
                }
            }
        } catch (e) {
            console.error("Failed to load theme settings", e);
        }
    };

    useEffect(() => {
        setMounted(true);
        refreshSettings();
    }, []);

    // Prevent hydration mismatch by rendering children only after mount (optional, but safer for style injection)
    // Actually for CSS vars on root, we want to render immediately, 
    // but the initial state might be "orange" while server sends plain HTML.
    
    return (
        <ThemeContext.Provider value={{
            currentTheme,
            logoUrl,
            setTheme: applyTheme,
            setLogoUrl,
            refreshSettings
        }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error("useTheme must be used within a ThemeProvider");
    return context;
};
