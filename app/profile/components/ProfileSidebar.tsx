"use client";

import React from "react";
import { User, Lock, Users, Bell, Globe, ChevronRight, LogOut, LucideIcon, Shield, CheckCircle2 } from "lucide-react";
import { TabId } from "./types";

interface SidebarItem {
    id: TabId;
    icon: LucideIcon;
    label: string;
}

interface ProfileSidebarProps {
    activeTab: TabId;
    setActiveTab: (id: TabId) => void;
    isAdmin: boolean;
    onLogout: () => void;
    username: string;
    initials: string;
}

export const ProfileSidebar = ({ activeTab, setActiveTab, isAdmin, onLogout, username, initials }: ProfileSidebarProps) => {
    const menuItems: (SidebarItem | null)[] = [
        { id: "personal_info", icon: User, label: "Personal Info" },
        { id: "security", icon: Lock, label: "Security" },
        isAdmin ? { id: "user_management", icon: Users, label: "User Management" } : null,
        { id: "notifications", icon: Bell, label: "Notifications" },
        { id: "language", icon: Globe, label: "Language" },
    ];

    return (
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 ring-1 ring-slate-100 overflow-hidden">
            {/* User Identity Section */}
            <div className="p-6 flex flex-col items-center text-center bg-slate-50/50 border-b border-slate-100">
                <div className="h-24 w-24 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-3xl font-bold mb-4 shadow-lg ring-4 ring-white">
                    {initials}
                </div>
                <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-bold text-slate-900 capitalize">{username}</h2>
                    {isAdmin && <CheckCircle2 className="w-4 h-4 text-brand-primary" />}
                </div>
                <div className="flex items-center gap-2 mb-4">
                     <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ${
                        isAdmin 
                        ? "bg-violet-50 text-violet-700 ring-violet-200" 
                        : "bg-slate-100 text-slate-600 ring-slate-200"
                    }`}>
                        <Shield className="w-3 h-3" />
                        {isAdmin ? "Admin" : "User"}
                    </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">Member since Jan 2026</p>
            </div>

            {/* Navigation Menu */}
            <div className="p-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Menu</h3>
                <nav className="space-y-1">
                    {menuItems.filter(Boolean).map((item, i) => {
                        const menuItem = item as SidebarItem;
                        return (
                            <button 
                                key={i} 
                                onClick={() => setActiveTab(menuItem.id)}
                                className={`flex w-full items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === menuItem.id ? "bg-orange-50 text-brand-primary" : "text-slate-600 hover:bg-slate-50"}`}
                            >
                                <div className="flex items-center gap-3">
                                    <menuItem.icon className="w-4 h-4" />
                                    <span>{menuItem.label}</span>
                                </div>
                                <ChevronRight className={`w-4 h-4 ${activeTab === menuItem.id ? "opacity-100" : "opacity-30"}`} />
                            </button>
                        );
                    })}
                </nav>

                <div className="my-4 border-t border-slate-100"></div>

                <button 
                    onClick={onLogout}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 rounded-xl hover:bg-red-50 transition-all"
                >
                    <LogOut className="w-4 h-4" />
                    Log Out
                </button>
            </div>
        </div>
    );
};
