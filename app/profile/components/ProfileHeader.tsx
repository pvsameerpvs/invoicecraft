"use client";

import React from "react";
import { Share2, Edit2 } from "lucide-react";

interface ProfileHeaderProps {
    username: string;
    initials: string;
    isAdmin: boolean;
}

export const ProfileHeader = ({ username, initials, isAdmin }: ProfileHeaderProps) => {
    return (
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center md:items-end justify-between gap-6 md:gap-4 mb-6 text-white text-center md:text-left">
            <div>
                 <h1 className="text-3xl md:text-4xl font-bold tracking-tight">My Profile</h1>
                 <p className="mt-2 text-white/90 text-sm max-w-2xl font-medium">
                    Manage your account settings and preferences.
                 </p>
            </div>
            
            <div className="flex items-center gap-3">
                 
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-brand-primary text-sm font-bold shadow-lg shadow-black/10 hover:bg-slate-50 transition-all active:scale-95">
                    <Edit2 className="w-4 h-4" />
                    Edit Profile
                </button>
            </div>
        </div>
    );
};
