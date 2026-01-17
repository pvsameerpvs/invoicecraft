"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import { LayoutTemplate, Save, Loader2 } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export const TemplateSettingsSection = () => {
    const { 
        currentTheme, 
        logoUrl, 
        showCompanyName, 
        companyName, 
        navbarTitle, 
        invoiceTemplate, 
        setInvoiceTemplate 
    } = useTheme();
    
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const t = toast.loading("Saving template settings...");

        try {
            // 1. Fetch current full settings from API to ensure we don't overwrite other fields with stale data if any
            const currentRes = await fetch("/api/settings");
            const currentData = await currentRes.json();
            
            // 2. Prepare payload
            // We use the values from useTheme() for what we are editing, but ensure others are preserved
            const payload = {
                ...currentData,
                Theme: currentTheme, // preserve
                LogoUrl: logoUrl, // preserve
                ShowCompanyName: showCompanyName, // preserve
                CompanyName: companyName, // preserve
                NavbarTitle: navbarTitle, // preserve
                InvoiceTemplate: invoiceTemplate // Update this!
            };

            // 3. Save
            const res = await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.ok) {
                toast.success("Template settings updated!", { id: t });
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
                    <LayoutTemplate className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-900">Invoice Templates</h2>
                    <p className="text-xs text-slate-500">Choose the layout design for your invoices.</p>
                </div>
            </div>

            <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Template Selection Grid */}
                    <div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Classic Option */}
                            <button
                                type="button"
                                onClick={() => setInvoiceTemplate("classic")}
                                className={`group relative flex flex-col gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                                    invoiceTemplate === "classic" || !invoiceTemplate 
                                    ? "border-brand-primary bg-brand-50/30 ring-4 ring-brand-50" 
                                    : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-md"
                                }`}
                            >
                                <div className="aspect-[210/297] w-full rounded-xl bg-slate-50 border border-slate-200 overflow-hidden relative shadow-sm group-hover:shadow-md transition-shadow">
                                    {/* Abstract representation of Classic Template */}
                                    <div className="absolute top-4 left-0 right-0 h-4 mx-4 bg-slate-200 rounded-sm"></div>
                                    <div className="absolute top-12 left-4 h-6 w-16 bg-slate-200 rounded-sm"></div>
                                    <div className="absolute top-24 left-4 right-4 h-32 border border-slate-100 bg-white rounded-sm p-2 space-y-2">
                                        <div className="w-full h-2 bg-slate-100 rounded-sm"></div>
                                        <div className="w-full h-2 bg-slate-100 rounded-sm"></div>
                                        <div className="w-full h-2 bg-slate-100 rounded-sm"></div>
                                    </div>
                                    
                                    {/* Selected Badge */}
                                    {(invoiceTemplate === "classic" || !invoiceTemplate) && (
                                        <div className="absolute top-2 right-2 flex items-center gap-1 bg-brand-primary text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">
                                            Active
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className={`font-bold ${invoiceTemplate === "classic" || !invoiceTemplate ? "text-brand-primary" : "text-slate-900"}`}>Classic Layout</h3>
                                    <p className="text-xs text-slate-500 mt-1">The original, standard invoice design. Simple and effective.</p>
                                </div>
                            </button>

                            {/* Modern Option */}
                            <button
                                type="button"
                                onClick={() => setInvoiceTemplate("modern")}
                                className={`group relative flex flex-col gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                                    invoiceTemplate === "modern" 
                                    ? "border-brand-primary bg-brand-50/30 ring-4 ring-brand-50" 
                                    : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-md"
                                }`}
                            >
                                <div className="aspect-[210/297] w-full rounded-xl bg-slate-50 border border-slate-200 overflow-hidden relative shadow-sm group-hover:shadow-md transition-shadow">
                                     {/* Abstract representation of Modern Template */}
                                     {/* Full width header */}
                                    <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-r from-brand-primary/20 to-brand-end/20 border-b border-brand-primary/10"></div>
                                    <div className="absolute top-4 left-4 h-6 w-16 bg-white/50 rounded-sm backbone"></div>
                                    <div className="absolute top-24 left-4 right-4 space-y-3">
                                         <div className="grid grid-cols-2 gap-4">
                                            <div className="h-12 bg-white rounded-lg border border-slate-100"></div>
                                            <div className="h-12 bg-white rounded-lg border border-slate-100"></div>
                                         </div>
                                         <div className="h-20 bg-white rounded-lg border border-slate-100"></div>
                                    </div>

                                    {/* Selected Badge */}
                                    {invoiceTemplate === "modern" && (
                                        <div className="absolute top-2 right-2 flex items-center gap-1 bg-brand-primary text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">
                                            Active
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className={`font-bold ${invoiceTemplate === "modern" ? "text-brand-primary" : "text-slate-900"}`}>Modern Layout</h3>
                                    <p className="text-xs text-slate-500 mt-1">A professional, contemporary design with accented headers and clean typography.</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end border-t border-slate-100">
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
                                    <span>Save Preference</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
