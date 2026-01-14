"use client";

import React, { useState } from "react";
import { Bell, Globe } from "lucide-react";
import { TabId } from "./types";
import toast from "react-hot-toast";

const SecurityForm = ({ username }: { username: string }) => {
    const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
    const [newUsername, setNewUsername] = useState(username);
    const [loading, setLoading] = useState(false);

    // Sync state if prop changes
    React.useEffect(() => {
        setNewUsername(username);
    }, [username]);

    const handleUpdate = async () => {
        if (!newUsername) {
             toast.error("Username cannot be empty");
             return;
        }

        if (passwords.new && passwords.new !== passwords.confirm) {
            toast.error("Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            const body: any = {};
            if (passwords.new) body.password = passwords.new;
            if (newUsername !== username) body.username = newUsername;

            if (Object.keys(body).length === 0) {
                 toast("No changes made");
                 setLoading(false);
                 return;
            }

            const res = await fetch("/api/users", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            
            if (data.ok) {
                toast.success("Settings updated successfully");
                setPasswords({ current: "", new: "", confirm: "" });
                
                if (newUsername !== username) {
                    // Update local storage and reload to refresh app state
                    localStorage.setItem("invoicecraft:username", newUsername);
                    window.location.reload(); 
                }
            } else {
                toast.error(data.error || "Failed to update settings");
            }
        } catch (error) {
             toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Username</label>
                <input 
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    autoComplete="username"
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all font-mono text-sm"
                    placeholder="Enter username"
                />
            </div>
             <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">New Password</label>
                <input 
                    type="password"
                    value={passwords.new}
                    onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                    autoComplete="new-password"
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all font-mono text-sm"
                    placeholder="Enter new password"
                />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Confirm Password</label>
                <input 
                    type="password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                    autoComplete="new-password"
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all font-mono text-sm"
                    placeholder="Confirm new password"
                />
            </div>

            <div className="pt-2">
                <button 
                    onClick={handleUpdate}
                    disabled={loading}
                    className="px-6 py-2.5 bg-brand-primary text-white text-sm font-semibold rounded-xl hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? "Updating..." : "Update Settings"}
                </button>
            </div>
        </div>
    );
};

interface SettingsSectionProps {
    activeTab: TabId;
    username?: string;
}

export const SettingsSection = ({ activeTab, username }: SettingsSectionProps) => {
    if (activeTab === "security") {
         return (
             <section className="bg-white rounded-3xl p-8 shadow-sm ring-1 ring-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-slate-900">Account Settings</h2>
                    <p className="text-sm text-slate-400">Update your account credentials.</p>
                </div>

                <div className="space-y-6 max-w-lg">
                     {/* Password Change Form */}
                     <SecurityForm username={username || ""} />
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
