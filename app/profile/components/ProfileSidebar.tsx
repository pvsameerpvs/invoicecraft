"use client";

import React from "react";
import { User, Lock, Users, Bell, Globe, ChevronRight, LogOut, LucideIcon, Shield, CheckCircle2, Package, Building2, Palette } from "lucide-react";
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
    joinedAt?: string;
}

export const ProfileSidebar = ({ activeTab, setActiveTab, isAdmin, onLogout, username, initials, joinedAt }: ProfileSidebarProps) => {
    const menuItems: (SidebarItem | null)[] = [
        { id: "personal_info", icon: User, label: "Personal Info" },
        { id: "security", icon: Lock, label: "Security" },
        isAdmin ? { id: "user_management", icon: Users, label: "User Management" } : null,
        isAdmin ? { id: "products", icon: Package, label: "Products" } : null,
        isAdmin ? { id: "company_details", icon: Building2, label: "Company Details" } : null,
        isAdmin ? { id: "theme_settings", icon: Palette, label: "Theme Checking" } : null,
        { id: "notifications", icon: Bell, label: "Notifications" },
        { id: "language", icon: Globe, label: "Language" },
    ];

    const memberSince = React.useMemo(() => {
        if (!joinedAt) return null;
        try {
            const date = new Date(joinedAt);
            if (isNaN(date.getTime())) return null;
            
            return `Member since ${date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
        } catch (e) {
            return null;
        }
    }, [joinedAt]);

    const sectionStyles = "mb-6";
    const headerStyles = "px-4 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider";

    return (
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 ring-1 ring-slate-100 overflow-hidden h-full">
            {/* User Identity Section */}
            <div className="p-6 flex flex-col items-center text-center bg-gradient-to-b from-slate-50/50 to-white border-b border-slate-100">
                <div className="relative group">
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 text-white flex items-center justify-center text-3xl font-bold mb-4 shadow-xl ring-4 ring-white group-hover:scale-105 transition-transform duration-300">
                        {initials}
                    </div>
                    {isAdmin && (
                        <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-sm">
                            <CheckCircle2 className="w-5 h-5 text-brand-primary fill-brand-50" />
                        </div>
                    )}
                </div>
                
                <h2 className="text-xl font-bold text-slate-900 capitalize mb-1">{username}</h2>
                <div className="flex items-center justify-center gap-2 mb-3">
                     <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 transition-colors ${
                        isAdmin 
                        ? "bg-violet-50 text-violet-700 ring-violet-200" 
                        : "bg-slate-50 text-slate-600 ring-slate-200"
                    }`}>
                        <Shield className="w-3 h-3" />
                        {isAdmin ? "Administrator" : "User"}
                    </span>
                </div>
                {memberSince && <p className="text-xs text-slate-400 font-medium">{memberSince}</p>}
            </div>

            {/* Navigation Menu */}
            <div className="p-4 overflow-y-auto max-h-[calc(100%-300px)] custom-scrollbar">
                {/* User Details Section */}
                <div className={sectionStyles}>
                    <h3 className={headerStyles}>User Details</h3>
                    <div className="space-y-1">
                        <SidebarButton 
                            id="personal_info" 
                            icon={User} 
                            label="Personal Info" 
                            activeTab={activeTab} 
                            setActiveTab={setActiveTab} 
                        />
                    </div>
                </div>

                {/* Company Details Section (Admin Only) */}
                {isAdmin && (
                    <div className={sectionStyles}>
                        <h3 className={headerStyles}>Company Details</h3>
                        <div className="space-y-1">
                            <SidebarButton id="company_details" icon={Building2} label="Company Profile" activeTab={activeTab} setActiveTab={setActiveTab} />
                            <SidebarButton id="products" icon={Package} label="Products & Services" activeTab={activeTab} setActiveTab={setActiveTab} />
                        </div>
                    </div>
                )}

                {/* Settings Section */}
                <div className={sectionStyles}>
                    <h3 className={headerStyles}>Settings</h3>
                    <div className="space-y-1">
                         {isAdmin && <SidebarButton id="user_management" icon={Users} label="User Management" activeTab={activeTab} setActiveTab={setActiveTab} />}
                         <SidebarButton id="security" icon={Lock} label="Security" activeTab={activeTab} setActiveTab={setActiveTab} />
                         <SidebarButton id="notifications" icon={Bell} label="Notifications" activeTab={activeTab} setActiveTab={setActiveTab} />
                         {isAdmin && <SidebarButton id="theme_settings" icon={Palette} label="Theme Settings" activeTab={activeTab} setActiveTab={setActiveTab} />}
                         <SidebarButton id="language" icon={Globe} label="Language" activeTab={activeTab} setActiveTab={setActiveTab} />
                    </div>
                </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/30">
                <button 
                    onClick={onLogout}
                    className="group flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-slate-600 bg-white rounded-xl border border-slate-200 hover:border-red-200 hover:text-red-600 hover:bg-red-50 transition-all shadow-sm"
                >
                    <div className="flex items-center gap-3">
                        <LogOut className="w-4 h-4 text-slate-400 group-hover:text-red-500 transition-colors" />
                        <span>Sign Out</span>
                    </div>
                </button>
            </div>
        </div>
    );
};

// Helper Component for consistent buttons
const SidebarButton = ({ id, icon: Icon, label, activeTab, setActiveTab }: { id: TabId, icon: any, label: string, activeTab: TabId, setActiveTab: (id: TabId) => void }) => (
    <button 
        onClick={() => setActiveTab(id)}
        className={`group flex w-full items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
            activeTab === id 
            ? "bg-brand-50 text-brand-primary shadow-sm ring-1 ring-brand-100" 
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        }`}
    >
        <div className="flex items-center gap-3">
            <Icon className={`w-4 h-4 transition-colors ${activeTab === id ? "text-brand-primary" : "text-slate-400 group-hover:text-slate-600"}`} />
            <span>{label}</span>
        </div>
        {activeTab === id && (
            <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-in fade-in zoom-in" />
        )}
    </button>
);
