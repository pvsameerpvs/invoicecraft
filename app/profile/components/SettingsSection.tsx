"use client";

import React from "react";
import { Bell, Globe } from "lucide-react";
import { TabId } from "./types";

interface SettingsSectionProps {
    activeTab: TabId;
}

export const SettingsSection = ({ activeTab }: SettingsSectionProps) => {
    if (activeTab === "security") {
         return (
             <section className="bg-white rounded-3xl p-8 shadow-sm ring-1 ring-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-slate-900">Security Settings</h2>
                    <p className="text-sm text-slate-400">Update your password and security preferences.</p>
                </div>
                <div className="p-4 rounded-xl bg-orange-50 border border-orange-100 text-orange-800 text-sm">
                    Security settings are not available in this demo.
                </div>
             </section>
        );
    }
    
    if (activeTab === "notifications") {
         return (
             <section className="bg-white rounded-3xl p-8 shadow-sm ring-1 ring-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-slate-900">Notifications</h2>
                    <p className="text-sm text-slate-400">Manage your email alerts.</p>
                </div>
                
                 <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-white text-slate-600 rounded-xl shadow-sm ring-1 ring-slate-100">
                            <Bell className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-900">Email Notifications</p>
                            <p className="text-xs text-slate-400">Receive updates about your invoices</p>
                        </div>
                    </div>
                     <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-brand-primary transition-colors cursor-pointer">
                        <span className="translate-x-6 inline-block h-4 w-4 rounded-full bg-white transition-transform" />
                    </div>
                </div>
             </section>
        );
    }

    if (activeTab === "language") {
         return (
             <section className="bg-white rounded-3xl p-8 shadow-sm ring-1 ring-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-slate-900">Language</h2>
                    <p className="text-sm text-slate-400">Select your preferred language.</p>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <Globe className="w-5 h-5 text-slate-400" />
                    <span className="text-sm font-medium text-slate-900">English (US)</span>
                </div>
             </section>
        );
    }

    return null;
};
