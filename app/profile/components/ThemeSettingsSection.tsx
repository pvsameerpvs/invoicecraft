"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Palette, Save, Loader2 } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { themes } from "@/lib/themes";

export const ThemeSettingsSection = () => {
    const { currentTheme, setTheme, logoUrl, setLogoUrl } = useTheme();
    const [loading, setLoading] = useState(false); // Theme is loaded by provider immediately
    const [saving, setSaving] = useState(false);

    // Because theme/logo state is global, we don't fetch from /api/settings here differently.
    // However, saving needs to post everything back. 
    // To safe-guard other settings, we might need to fetch them first or update the API to support PATCH.
    // Current API overwrites everything if we aren't careful? 
    // Wait, the API `POST` expects `body.CompanyName` etc. If missing, it writes "" (empty string).
    // This is DESTRUCTIVE if we only send Theme/Logo.
    // I MUST fetch current settings first to merge them before saving.
    
    // Actually, `useTheme` manages the "optimistic" state. 
    // But to save, we shouldn't overwrite Company Name with empty string.
    
    // Let's refactor the API briefly if we can? 
    // User didn't ask for API refactor, but it's safer.
    // Alternatively, just fetch current settings in `handleSubmit`.

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const t = toast.loading("Saving theme settings...");

        try {
            // 1. Fetch current full settings to avoid overwriting unrelated data
            const currentRes = await fetch("/api/settings");
            const currentData = await currentRes.json();
            
            // 2. Prepare payload
            const payload = {
                ...currentData,
                Theme: currentTheme,
                LogoUrl: logoUrl
            };

            // 3. Save
            const res = await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.ok) {
                toast.success("Theme updated successfully!", { id: t });
            } else {
                throw new Error(data.error || "Failed to save");
            }
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Failed to update settings", { id: t });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 ring-1 ring-slate-100 overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100 text-brand-primary">
                    <Palette className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-900">Theme & Branding</h2>
                    <p className="text-xs text-slate-500">Customize the look and feel of your application.</p>
                </div>
            </div>

            <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Branding & Appearance */}
                    <div className="space-y-4">
                         {/* Theme Selection */}
                         <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase">Color Theme</label>
                            <div className="flex flex-wrap gap-3">
                                {themes.map(t => (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => setTheme(t.id)}
                                        className={`group relative h-10 w-10 rounded-full border-2 transition-all ${currentTheme === t.id ? "border-slate-900 scale-110" : "border-transparent hover:scale-105"}`}
                                        title={t.label}
                                    >
                                        <div 
                                            className="absolute inset-0.5 rounded-full" 
                                            style={{ background: `linear-gradient(135deg, ${t.colors.start}, ${t.colors.end})` }}
                                        />
                                        {currentTheme === t.id && (
                                            <div className="absolute inset-0 flex items-center justify-center text-white">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-slate-400 mt-2">Select a theme to preview it instantly.</p>
                        </div>

                        {/* Logo Upload */}
                        <div className="pt-2">
                             <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Company Logo</label>
                             <div className="flex items-center gap-4">
                                <div className="h-16 w-16 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                                    {logoUrl ? (
                                        <img src={logoUrl} alt="Logo Preview" className="h-full w-full object-contain" />
                                    ) : (
                                        <span className="text-[10px] text-slate-400">No Logo</span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <input 
                                        type="file"
                                        accept="image/*"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;

                                            // Client-side validation
                                            if (file.size > 5 * 1024 * 1024) {
                                                toast.error("File is too large. Max 5MB.");
                                                return;
                                            }

                                            setLoading(true);
                                            const t = toast.loading("Uploading logo...");

                                            try {
                                                const formData = new FormData();
                                                formData.append("file", file);

                                                const res = await fetch("/api/upload", {
                                                    method: "POST",
                                                    body: formData,
                                                });
                                                
                                                const data = await res.json();
                                                
                                                if (res.ok && data.url) {
                                                    setLogoUrl(data.url);
                                                    toast.success("Logo uploaded successfully", { id: t });
                                                } else {
                                                    throw new Error(data.error || "Upload failed");
                                                }
                                            } catch (err: any) {
                                                console.error(err);
                                                toast.error(err.message || "Failed to upload logo", { id: t });
                                            } finally {
                                                setLoading(false);
                                                // Reset input to allow selecting same file again
                                                e.target.value = "";
                                            }
                                        }}
                                        className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-primary hover:file:bg-brand-100"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">Recommended: PNG with transparent background.</p>
                                </div>
                             </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button 
                            type="submit" 
                            disabled={saving}
                            className="bg-brand-primary hover:bg-brand-end text-white text-sm font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-brand-200/50 flex items-center gap-2 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    <span>Save Settings</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
