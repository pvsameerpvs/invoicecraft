"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { ThemeId, themes } from "@/lib/themes";

interface ThemeContextType {
    currentTheme: ThemeId;
    logoUrl: string | undefined;
    companyName: string;
    navbarTitle: string;
    showCompanyName: boolean;
    setTheme: (id: ThemeId) => void;
    setLogoUrl: (url: string) => void;
    setCompanyName: (name: string) => void;
    setNavbarTitle: (title: string) => void;
    setShowCompanyName: (show: boolean) => void;
    refreshSettings: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [currentTheme, setCurrentTheme] = useState<ThemeId>("orange");
    const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);
    const [companyName, setCompanyName] = useState("");
    const [navbarTitle, setNavbarTitle] = useState("");
    const [showCompanyName, setShowCompanyName] = useState(false);

    const applyTheme = (themeId: ThemeId) => {
        const theme = themes.find(t => t.id === themeId) || themes[0];
        
        const root = document.documentElement;
        root.style.setProperty("--color-brand-start", theme.colors.start);
        root.style.setProperty("--color-brand-end", theme.colors.end);
        root.style.setProperty("--color-brand-primary", theme.colors.primary);
        
        // Also simpler hex for imperative usage if needed
        // Apply Full Palette
        const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
        shades.forEach(shade => {
            root.style.setProperty(`--color-brand-${shade}`, (theme.colors as any)[shade]);
        });
        
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
                if (data.CompanyName) {
                    setCompanyName(data.CompanyName);
                }
                if (data.NavbarTitle) {
                    setNavbarTitle(data.NavbarTitle);
                }
                // Check explicitly for "true" string or boolean true
                if (data.ShowCompanyName === "true" || data.ShowCompanyName === true) {
                    setShowCompanyName(true);
                } else {
                    setShowCompanyName(false);
                }
            }
        } catch (e) {
            console.error("Failed to load theme settings", e);
        }
    };

    useEffect(() => {
        refreshSettings();
    }, []);

    // Prevent hydration mismatch by rendering children only after mount (optional, but safer for style injection)
    // Actually for CSS vars on root, we want to render immediately, 
    // but the initial state might be "orange" while server sends plain HTML.
    
    return (
        <ThemeContext.Provider value={{
            currentTheme,
            logoUrl,
            companyName,
            navbarTitle,
            showCompanyName,
            setTheme: applyTheme,
            setLogoUrl,
            setCompanyName,
            setNavbarTitle,
            setShowCompanyName,
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
