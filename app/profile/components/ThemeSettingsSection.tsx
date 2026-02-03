"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Palette, Save, Loader2, Type, Maximize } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { ImageCropper } from "@/components/ImageCropper";
import { themes } from "@/lib/themes";

export const ThemeSettingsSection = () => {
    const { currentTheme, setTheme, logoUrl, setLogoUrl, logoSize, setLogoSize, showCompanyName, setShowCompanyName, companyName, navbarTitle, setNavbarTitle } = useTheme();
    const [saving, setSaving] = useState(false);
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [selectedFileSrc, setSelectedFileSrc] = useState<string | null>(null);

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
                LogoUrl: logoUrl,
                LogoSize: logoSize,
                ShowCompanyName: showCompanyName,
                CompanyName: companyName,
                NavbarTitle: navbarTitle
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

    const handleCropComplete = async (croppedBlob: Blob) => {
        const t = toast.loading("Uploading cropped logo...");

        try {
            const formData = new FormData();
            formData.append("file", croppedBlob, "logo.png");

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (res.ok && data.url) {
                setLogoUrl(data.url);
                toast.success("Logo uploaded successfully", { id: t });
                setCropModalOpen(false);
                setSelectedFileSrc(null);
            } else {
                throw new Error(data.error || "Upload failed");
            }
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Failed to upload logo", { id: t });
        } finally {
            // Loading handled by toast
        }
    };

    return (
        <>
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
                                
                                {/* Custom Color Picker */}
                                <div className="relative h-10 w-10">
                                    <input 
                                        type="color" 
                                        onChange={(e) => setTheme(e.target.value)}
                                        className="h-10 w-10 rounded-full cursor-pointer absolute inset-0 opacity-0 z-10"
                                        title="Custom Color"
                                    />
                                    <div className={`h-10 w-10 rounded-full border-2 flex items-center justify-center bg-white transition-all ${currentTheme.startsWith("#") ? "border-slate-900 scale-110" : "border-slate-200"}`}>
                                        <div 
                                            className="h-6 w-6 rounded-full border border-slate-200"
                                            style={{ 
                                                background: currentTheme.startsWith("#") 
                                                    ? currentTheme 
                                                    : "conic-gradient(red, orange, yellow, green, blue, indigo, violet)" 
                                            }}
                                        />
                                    </div>
                                    {currentTheme.startsWith("#") && (
                                         <div className="absolute inset-0 flex items-center justify-center text-white pointer-events-none z-20">
                                            <svg className="w-4 h-4 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <p className="text-xs text-slate-400 mt-2">Select a preset or choose a custom color.</p>
                        </div>

                        {/* Logo Upload */}
                        <div className="pt-2">
                             <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Company Logo</label>
                             <div className="flex flex-col lg:flex-row items-stretch gap-6 p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                                {/* Live Preview of Logo */}
                                <div className="flex flex-col items-center gap-4 bg-slate-900 rounded-2xl p-6 border border-slate-700 shadow-inner min-w-[260px]">
                                    <div className="flex items-center justify-center bg-white rounded-xl shadow-2xl p-4 overflow-hidden relative" 
                                         style={{ width: '220px', height: '160px' }}>
                                        {logoUrl ? (
                                            <div className="relative flex items-center justify-center w-full h-full">
                                                {/* Checkerboard background */}
                                                <div className="absolute inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: 'conic-gradient(#000 0.25turn, #ccc 0.25turn 0.5turn, #000 0.5turn 0.75turn, #ccc 0.75turn)', backgroundSize: '10px 10px' }} />
                                                <img 
                                                    src={logoUrl} 
                                                    alt="Live Preview" 
                                                    className="relative z-10 w-auto object-contain transition-all duration-200 ease-out"
                                                    style={{ height: `${logoSize}px`, maxHeight: '100%', maxWidth: '100%' }}
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-slate-300">
                                                <Palette className="w-8 h-8 opacity-20" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">No Logo</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-center">
                                        <div className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] mb-1">Live Document Preview</div>
                                        <div className="text-[9px] text-slate-500 font-medium">As it will appear on PDFs</div>
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col justify-center gap-4">
                                     {/* Logo Upload Container */}
                                     <div className="flex flex-col gap-4 p-5 rounded-2xl border border-slate-100 bg-white shadow-sm ring-1 ring-slate-100/50">
                                        <div className="flex items-center gap-4">
                                            <div className="relative group shrink-0">
                                                <div className="h-16 w-16 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden">
                                                    {logoUrl ? (
                                                        <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
                                                    ) : (
                                                        <Palette className="w-5 h-5 text-slate-300" />
                                                    )}
                                                </div>
                                                {logoUrl && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedFileSrc(logoUrl);
                                                            setCropModalOpen(true);
                                                        }}
                                                        className="absolute -top-2 -right-2 p-1.5 bg-white rounded-lg shadow-lg border border-slate-100 text-brand-primary opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                                                    >
                                                        <Maximize className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs font-bold text-slate-700">{logoUrl ? "Logo Selected" : "No Logo Uploaded"}</p>
                                                <p className="text-[10px] text-slate-400 font-medium leading-tight">PNG or SVG with transparent background works best.</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-50">
                                            <label className="cursor-pointer bg-brand-primary hover:bg-brand-end text-white text-[11px] font-bold py-2 px-4 rounded-xl shadow-lg shadow-brand-200/50 transition-all active:scale-95 flex items-center gap-2">
                                                <Save className="w-3.5 h-3.5 rotate-90" />
                                                <span>Upload New</span>
                                                <input 
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;
                                                        const reader = new FileReader();
                                                        reader.addEventListener("load", () => {
                                                            setSelectedFileSrc(reader.result?.toString() || null);
                                                            setCropModalOpen(true);
                                                        });
                                                        reader.readAsDataURL(file);
                                                        e.target.value = "";
                                                    }}
                                                />
                                            </label>
                                            {logoUrl && (
                                                <button 
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedFileSrc(logoUrl);
                                                        setCropModalOpen(true);
                                                    }}
                                                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold py-2 px-4 rounded-xl transition-all flex items-center gap-2"
                                                >
                                                    <Maximize className="w-3.5 h-3.5" />
                                                    <span>Crop</span>
                                                </button>
                                            )}
                                        </div>
                                     </div>
                                </div>
                             </div>
                        </div>

                         {/* Logo Size Adjustment */}
                         {logoUrl && (
                            <div className="pt-4 border-t border-slate-100">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Logo Display Size</label>
                                    <span className="text-xs font-bold text-brand-primary bg-brand-50 px-2 py-1 rounded-lg">{logoSize}px</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-bold text-slate-400">10PX</span>
                                    <input 
                                        type="range" 
                                        min="10" 
                                        max="100" 
                                        step="1"
                                        value={logoSize}
                                        onChange={(e) => setLogoSize(parseInt(e.target.value))}
                                        className="flex-1 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                                    />
                                    <span className="text-[10px] font-bold text-slate-400">100PX</span>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2">
                                    Adjust how large your logo appears on the tax invoice and quotations.
                                </p>
                            </div>
                         )}

                        {/* Navbar Options */}
                        <div className="pt-2 border-t border-slate-100 mt-4">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative inline-flex items-center">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={showCompanyName}
                                        onChange={(e) => setShowCompanyName(e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-100 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                                </div>
                                <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Show Company Name in Navbar?</span>
                            </label>
                            <p className="text-xs text-slate-400 mt-2 ml-14">
                                Enable this if your logo does not include the company name text.
                            </p>
                        </div>

                        {/* Navbar Display Name - Conditionally shown or just below */}
                        {showCompanyName && (
                             <div className="pt-2">
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Navbar Display Name (Optional)</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                        <Type className="h-4 w-4" />
                                    </div>
                                    <input 
                                        type="text"
                                        value={navbarTitle}
                                        onChange={(e) => setNavbarTitle(e.target.value)}
                                        placeholder={companyName || "e.g. My App"}
                                        className="block w-full rounded-lg border-slate-200 bg-slate-50 pl-10 pr-3 py-2.5 text-sm focus:border-brand-primary/50 focus:ring-4 focus:ring-brand-primary/10 transition-all placeholder:text-slate-400"
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1.5">
                                    <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                                    <span>If provided, this text will be shown in the navbar instead of your Company Name.</span>
                                </p>
                            </div>
                        )}
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
        
        {cropModalOpen && selectedFileSrc && (
            <ImageCropper
                imageSrc={selectedFileSrc}
                onCropComplete={handleCropComplete}
                onCancel={() => {
                    setCropModalOpen(false);
                    setSelectedFileSrc(null);
                }}
            />
        )}
        </>
    );
};
