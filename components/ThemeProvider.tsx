"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { ThemeId, themes } from "@/lib/themes";
import { generatePalette } from "@/lib/colors";
import { toast } from "react-hot-toast";

interface ThemeContextType {
    currentTheme: string;
    logoUrl: string | undefined;
    logoSize: number;
    companyName: string;
    navbarTitle: string;
    invoiceTemplate: string;
    showCompanyName: boolean;
    setTheme: (id: string) => void;
    setLogoUrl: (url: string) => void;
    setLogoSize: (size: number) => void;
    setCompanyName: (name: string) => void;
    setNavbarTitle: (title: string) => void;
    setInvoiceTemplate: (template: string) => void;
    setShowCompanyName: (show: boolean) => void;
    refreshSettings: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [currentTheme, setCurrentTheme] = useState<string>("orange");
    const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);
    const [logoSize, setLogoSize] = useState<number>(80);
    const [companyName, setCompanyName] = useState("");
    const [navbarTitle, setNavbarTitle] = useState("");
    const [invoiceTemplate, setInvoiceTemplate] = useState("classic");
    const [showCompanyName, setShowCompanyName] = useState(false);

    const applyTheme = (themeId: string) => {
        // Check if it's a preset theme
        const preset = themes.find(t => t.id === themeId);
        
        let colors;
        if (preset) {
            colors = preset.colors;
        } else if (themeId.startsWith("#")) {
            // It's a custom hex color
            const palette = generatePalette(themeId);
            colors = {
                start: palette[500], // Use base as start
                end: palette[600],   // Slightly darker as end
                primary: palette[500],
                ...palette
            };
        } else {
            // Fallback
            colors = themes[0].colors;
        }
        
        const root = document.documentElement;
        root.style.setProperty("--color-brand-start", colors.start);
        root.style.setProperty("--color-brand-end", colors.end);
        root.style.setProperty("--color-brand-primary", colors.primary);
        
        // Apply Full Palette
        const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
        shades.forEach(shade => {
            // TS check: colors object needs to have index signature or we cast
            root.style.setProperty(`--color-brand-${shade}`, (colors as any)[shade]);
        });
        
        setCurrentTheme(themeId);
    };

    const refreshSettings = async () => {
        try {
            const res = await fetch("/api/settings?t=" + Date.now());
            const data = await res.json();
            
            if (data && !data.error) {
                if (data.Theme) {
                    applyTheme(data.Theme);
                }
                if (data.LogoUrl) {
                    setLogoUrl(data.LogoUrl);
                }
                if (data.LogoSize) {
                    setLogoSize(parseInt(data.LogoSize) || 80);
                }
                if (data.CompanyName) {
                    setCompanyName(data.CompanyName);
                }
                if (data.NavbarTitle) {
                    setNavbarTitle(data.NavbarTitle);
                }
                if (data.InvoiceTemplate) {
                    setInvoiceTemplate(data.InvoiceTemplate);
                }
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

    return (
        <ThemeContext.Provider value={{
            currentTheme,
            logoUrl,
            logoSize,
            companyName,
            navbarTitle,
            invoiceTemplate,
            showCompanyName,
            setTheme: applyTheme,
            setLogoUrl,
            setLogoSize,
            setCompanyName,
            setNavbarTitle,
            setInvoiceTemplate,
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
