"use client";

import React from "react";
import { Share2, Edit2 } from "lucide-react";

interface ProfileHeaderProps {
    username: string;
    initials: string;
    isAdmin: boolean;
}

export const ProfileHeader = ({ username, initials, isAdmin }: ProfileHeaderProps) => {
    const timeGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    };

    return (
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center md:items-end justify-between gap-6 md:gap-4 mb-6 text-white text-center md:text-left transition-all duration-500 ease-out animate-in slide-in-from-bottom-5 fade-in">
            <div className="relative z-10">
                 <div className="flex items-center gap-3 mb-2 justify-center md:justify-start">
                    <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-bold uppercase tracking-widest backdrop-blur-md">
                        {isAdmin ? "Administrator Account" : "Standard Account"}
                    </span>
                    <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                 </div>
                 <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white drop-shadow-sm">
                    {timeGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-200 to-white">{username}</span>
                 </h1>
                 <p className="mt-4 text-slate-300 text-sm max-w-2xl font-medium leading-relaxed">
                    Manage your personal details, security preferences, and account settings in one place.
                 </p>
            </div>
            
           
        </div>
    );
};
