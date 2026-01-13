"use client";

import React from "react";
import { Camera, Shield, Share2, Edit2, CheckCircle2 } from "lucide-react";

interface ProfileHeaderProps {
    username: string;
    initials: string;
    isAdmin: boolean;
}

export const ProfileHeader = ({ username, initials, isAdmin }: ProfileHeaderProps) => {
    return (
        <>
            {/* Full Width Cover Section */}
            <div className="relative h-48 md:h-64 w-full bg-slate-100 overflow-hidden group">
                 {/* Original Orange Gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 transition-transform duration-700 group-hover:scale-105"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10"></div>
                
                {/* Subtle Pattern */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
            </div>

            {/* Info Bar Section */}
            <div className="relative bg-white border-b border-slate-200 shadow-sm z-10">
                <div className="max-w-5xl mx-auto px-4 md:px-8 pb-6">
                    <div className="flex flex-col md:flex-row items-center md:items-end -mt-16 md:-mt-20 gap-4 md:gap-6">
                        
                        {/* Avatar */}
                        <div className="relative shrink-0 group/avatar">
                            <div className="h-32 w-32 md:h-40 md:w-40 rounded-[2rem] bg-white p-1 shadow-2xl ring-4 ring-white overflow-hidden transform transition-all duration-300 group-hover/avatar:scale-105 group-hover/avatar:rotate-1">
                                <div className="h-full w-full rounded-[1.8rem] bg-slate-900 flex items-center justify-center text-5xl md:text-6xl font-bold text-white shadow-inner relative">
                                    <span className="relative z-10">{initials}</span>
                                    {/* Gloss */}<div className="absolute top-0 left-0 w-full h-1/2 bg-white/5"></div>
                                </div>
                            </div>
                            <button className="absolute bottom-2 right-2 p-2.5 bg-white text-slate-800 rounded-2xl shadow-lg hover:bg-slate-50 hover:shadow-xl transition-all scale-90 opacity-0 group-hover/avatar:opacity-100 group-hover/avatar:scale-100">
                                <Camera className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Text Info */}
                        <div className="flex-1 pt-2 md:pt-0 pb-2 text-center md:text-left w-full">
                            <div className="flex flex-col md:flex-row items-center md:items-start md:gap-4 mb-2">
                                <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight capitalize">
                                    {username}
                                </h1>
                                {isAdmin && (
                                    <span className="flex bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full text-xs font-bold items-center gap-1 ring-1 ring-blue-100 mt-2 md:mt-1">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ring-1 ${
                                    isAdmin 
                                    ? "bg-slate-900 text-white ring-slate-900 shadow-md shadow-slate-900/20" 
                                    : "bg-slate-100 text-slate-600 ring-slate-200"
                                }`}>
                                    <Shield className="w-3.5 h-3.5" />
                                    {isAdmin ? "Administrator" : "Standard User"}
                                </span>
                                <span className="text-sm text-slate-500 font-medium">Joined January 2026</span>
                            </div>
                        </div>

                         {/* Action Buttons */}
                        <div className="w-full md:w-auto flex items-center justify-center gap-3 mb-2">
                             <button className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl shadow-lg shadow-slate-900/20 hover:bg-slate-800 hover:shadow-slate-900/30 transition-all active:scale-95 transform hover:-translate-y-0.5 w-full md:w-auto justify-center">
                                <Edit2 className="w-4 h-4" />
                                Edit Profile
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </>
    );
};
