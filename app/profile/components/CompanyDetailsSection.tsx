"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Building2, Save, Loader2 } from "lucide-react";
import { Skeleton } from "../../../components/ui/skeleton";

export const CompanyDetailsSection = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Form State
    const [formData, setFormData] = useState({
        CompanyName: "",
        CompanyAddress: "",
        CompanyTrn: "",
        BankCompanyName: "",
        BankName: "",
        BankLabel: "",
        AccountNumber: "",
        AccountIban: "",
        FooterNote: "",
        SignatureLabel: "",
        Currency: "AED",
        CompanyEmail: "",
        CompanyPhone: "",
        BusinessProfile: "Product"
    });

    useEffect(() => {
        fetch("/api/settings")
            .then(res => res.json())
            .then(data => {
                if (data && !data.error) {
                    setFormData(prev => ({ ...prev, ...data }));
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const t = toast.loading("Saving settings...");

        try {
            // 1. Fetch current full settings to preserve Theme/Logo
            const currentRes = await fetch("/api/settings");
            const currentData = await currentRes.json();

            // 2. Merge new company details with existing Theme/Logo
            const payload = {
                ...currentData, // Keeps Theme, LogoUrl, etc.
                ...formData     // Overwrites Company info
            };

            const res = await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.ok) {
                toast.success("Settings saved successfully!", { id: t });
            } else {
                throw new Error(data.error || "Failed to save");
            }
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Failed to save settings", { id: t });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 ring-1 ring-slate-100 overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center gap-3">
                 <Skeleton className="h-10 w-10 rounded-lg" />
                 <div className="space-y-2">
                     <Skeleton className="h-4 w-48" />
                     <Skeleton className="h-3 w-64" />
                 </div>
            </div>
            <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {[1,2,3].map(i => (
                         <div key={i} className="space-y-2">
                             <Skeleton className="h-3 w-24" />
                             <Skeleton className="h-10 w-full rounded-lg" />
                         </div>
                     ))}
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-24 w-full rounded-lg" />
                </div>
                 <div className="pt-4 space-y-4">
                     <Skeleton className="h-4 w-32" />
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {[1,2,3,4,5].map(i => (
                             <div key={i} className="space-y-2">
                                 <Skeleton className="h-3 w-24" />
                                 <Skeleton className="h-10 w-full rounded-lg" />
                             </div>
                         ))}
                     </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 ring-1 ring-slate-100 overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100 text-brand-primary">
                    <Building2 className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-900">Company Invoice Settings</h2>
                    <p className="text-xs text-slate-500">These details will be used as defaults for new invoices.</p>
                </div>
            </div>

            <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* General Company Info */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Company Name</label>
                                <input 
                                    type="text" 
                                    name="CompanyName"
                                    value={formData.CompanyName}
                                    onChange={handleChange}
                                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                                    placeholder="e.g. Just Search LLC"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">TRN / Tax ID</label>
                                <input 
                                    type="text" 
                                    name="CompanyTrn"
                                    value={formData.CompanyTrn}
                                    onChange={handleChange}
                                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                                    placeholder="e.g. 100XXXXXXX"
                                />
                            </div>

                             <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Default Currency</label>
                                <input 
                                    type="text" 
                                    name="Currency"
                                    value={formData.Currency}
                                    onChange={handleChange}
                                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                                    placeholder="e.g. AED"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Company Email</label>
                                <input 
                                    type="email" 
                                    name="CompanyEmail"
                                    value={formData.CompanyEmail}
                                    onChange={handleChange}
                                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                                    placeholder="e.g. hello@justsearch.ae"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Company Mobile / Phone</label>
                                <input 
                                    type="text" 
                                    name="CompanyPhone"
                                    value={formData.CompanyPhone}
                                    onChange={handleChange}
                                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                                    placeholder="e.g. +971 50 XXXXXXX"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Business Profile</label>
                                <select 
                                    name="BusinessProfile"
                                    value={formData.BusinessProfile}
                                    onChange={handleChange}
                                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                                >
                                    <option value="Product">Item / Product-based</option>
                                    <option value="Service">Service-based</option>
                                    <option value="Hourly">Hourly / Time-based</option>
                                    <option value="Project">Project / Lump-sum</option>
                                    <option value="Recurring">Recurring / Contract-based</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Company Address</label>
                            <textarea 
                                name="CompanyAddress"
                                rows={3}
                                value={formData.CompanyAddress}
                                onChange={handleChange}
                                className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all resize-none"
                                placeholder="Full address..."
                            />
                        </div>
                    </div>

                    {/* Bank Details */}
                    <div className="space-y-4 pt-4">
                         <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">Bank Details</h3>
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Bank Company Name</label>
                                <input 
                                    type="text" 
                                    name="BankCompanyName"
                                    value={formData.BankCompanyName}
                                    onChange={handleChange}
                                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Bank Name</label>
                                <input 
                                    type="text" 
                                    name="BankName"
                                    value={formData.BankName}
                                    onChange={handleChange}
                                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Account Number</label>
                                <input 
                                    type="text" 
                                    name="AccountNumber"
                                    value={formData.AccountNumber}
                                    onChange={handleChange}
                                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                                />
                            </div>

                             <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">IBAN</label>
                                <input 
                                    type="text" 
                                    name="AccountIban"
                                    value={formData.AccountIban}
                                    onChange={handleChange}
                                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                                />
                            </div>

                             <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Bank Label</label>
                                <input 
                                    type="text" 
                                    name="BankLabel"
                                    value={formData.BankLabel}
                                    onChange={handleChange}
                                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                                    placeholder="e.g. Bank"
                                />
                            </div>
                         </div>
                    </div>

                    {/* Footer & Signature */}
                     <div className="space-y-4 pt-4">
                         <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">Footer & Signature</h3>
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Footer Note</label>
                                <textarea 
                                    name="FooterNote"
                                    rows={2}
                                    value={formData.FooterNote}
                                    onChange={handleChange}
                                    className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Signature Label</label>
                                <input 
                                    type="text" 
                                    name="SignatureLabel"
                                    value={formData.SignatureLabel}
                                    onChange={handleChange}
                                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                                />
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
                                    <span>Save Changes</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
