"use client";

import React from "react";
import { User, Lock, Users, Bell, Globe, ChevronRight, LogOut, LucideIcon } from "lucide-react";
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
}

export const ProfileSidebar = ({ activeTab, setActiveTab, isAdmin, onLogout }: ProfileSidebarProps) => {
    const menuItems: (SidebarItem | null)[] = [
        { id: "personal_info", icon: User, label: "Personal Info" },
        { id: "security", icon: Lock, label: "Security" },
        isAdmin ? { id: "user_management", icon: Users, label: "User Management" } : null,
        { id: "notifications", icon: Bell, label: "Notifications" },
        { id: "language", icon: Globe, label: "Language" },
    ];

    return (
        <div className="bg-white rounded-3xl p-6 shadow-sm ring-1 ring-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Menu</h3>
            <nav className="space-y-1">
                {menuItems.filter(Boolean).map((item, i) => {
                    const menuItem = item as SidebarItem;
                    return (
                        <button 
                            key={i} 
                            onClick={() => setActiveTab(menuItem.id)}
                            className={`flex w-full items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === menuItem.id ? "bg-orange-50 text-brand-primary" : "text-slate-600 hover:bg-slate-50"}`}
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

            <div className="my-6 border-t border-slate-100"></div>

            <button 
                onClick={onLogout}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 rounded-xl hover:bg-red-50 transition-all"
            >
                <LogOut className="w-4 h-4" />
                Log Out
            </button>
        </div>
    );
};
