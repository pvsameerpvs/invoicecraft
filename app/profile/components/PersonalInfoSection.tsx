"use client";

import React, { useState, useEffect } from "react";
import { User, Mail, Shield, Phone, Save, X } from "lucide-react";
import toast from "react-hot-toast";

interface PersonalInfoSectionProps {
    username: string;
    role: string;
    email: string;
    mobile: string;
    onUpdate?: () => void;
}

export const PersonalInfoSection = ({ username, role, email, mobile, onUpdate }: PersonalInfoSectionProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({ email: "", mobile: "" });

    useEffect(() => {
        setFormData({ email, mobile });
    }, [email, mobile]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/users", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (data.ok) {
                toast.success("Profile updated successfully");
                setIsEditing(false);
                if (onUpdate) onUpdate();
            } else {
                toast.error(data.error || "Failed to update profile");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="bg-white rounded-3xl p-8 shadow-sm ring-1 ring-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-bold text-slate-900">Personal Information</h2>
                    <p className="text-sm text-slate-400">Manage your personal details</p>
                </div>
                {!isEditing ? (
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="text-sm font-semibold text-brand-primary hover:text-brand-dark transition-colors"
                    >
                        Edit
                    </button>
                ) : (
                    <div className="flex items-center gap-2">
                         <button 
                            onClick={() => setIsEditing(false)}
                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                            disabled={saving}
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-brand-primary text-white rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50"
                        >
                            <Save className="w-3.5 h-3.5" />
                            {saving ? "Saving..." : "Save"}
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Username (Read Only) */}
                <div className="space-y-1.5 group">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Name</label>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-900 capitalize">{username}</span>
                    </div>
                </div>

                {/* Email (Editable) */}
                <div className="space-y-1.5 group">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
                    <div className={`flex items-center gap-3 p-3 rounded-xl bg-slate-50 border ${isEditing ? 'border-brand-primary ring-1 ring-brand-primary/20 bg-white' : 'border-slate-100'} transition-all`}>
                        <Mail className={`w-4 h-4 ${isEditing ? 'text-brand-primary' : 'text-slate-400'}`} />
                        {isEditing ? (
                            <input 
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="Enter email address"
                                className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-300"
                            />
                        ) : (
                            <span className="text-sm font-medium text-slate-900">{email || "Not set"}</span>
                        )}
                    </div>
                </div>

                {/* Role (Read Only) */}
                <div className="space-y-1.5 group">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</label>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <Shield className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-900 capitalize">{role === "admin" ? "Administrator" : "Standard User"}</span>
                    </div>
                </div>

                {/* Phone (Editable) */}
                <div className="space-y-1.5 group">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone</label>
                     <div className={`flex items-center gap-3 p-3 rounded-xl bg-slate-50 border ${isEditing ? 'border-brand-primary ring-1 ring-brand-primary/20 bg-white' : 'border-slate-100'} transition-all`}>
                        <Phone className={`w-4 h-4 ${isEditing ? 'text-brand-primary' : 'text-slate-400'}`} />
                        {isEditing ? (
                            <input 
                                type="tel"
                                value={formData.mobile}
                                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                placeholder="Enter mobile number"
                                className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-300"
                            />
                        ) : (
                            <span className="text-sm font-medium text-slate-900">{mobile || "Not set"}</span>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};
