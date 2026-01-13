"use client";

import React from "react";
import { User, Mail, Shield } from "lucide-react";

interface PersonalInfoSectionProps {
    username: string;
    isAdmin: boolean;
}

export const PersonalInfoSection = ({ username, isAdmin }: PersonalInfoSectionProps) => (
    <section className="bg-white rounded-3xl p-8 shadow-sm ring-1 ring-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between mb-6">
            <div>
                <h2 className="text-lg font-bold text-slate-900">Personal Information</h2>
                <p className="text-sm text-slate-400">Manage your personal details</p>
            </div>
            <button className="text-sm font-semibold text-brand-primary hover:text-brand-dark transition-colors">Edit</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
                { label: "Full Name", value: username, icon: User },
                { label: "Email Address", value: `${username}@invoicecraft.com`, icon: Mail },
                { label: "Role", value: isAdmin ? "Administrator" : "Standard User", icon: Shield },
                { label: "Phone", value: "+971 50 000 0000", icon: null },
            ].map((field, i) => (
                <div key={i} className="space-y-1.5 group">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{field.label}</label>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 group-hover:bg-orange-50/50 group-hover:border-orange-100 transition-colors">
                        {field.icon && <field.icon className="w-4 h-4 text-slate-400 group-hover:text-brand-primary transition-colors" />}
                        <span className="text-sm font-medium text-slate-900 capitalize">{field.value}</span>
                    </div>
                </div>
            ))}
        </div>
    </section>
);
