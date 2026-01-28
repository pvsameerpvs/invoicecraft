"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bell, AlertCircle, Clock, ChevronRight, X, FileText, CheckCircle, FilePlus } from "lucide-react";
import { useRouter } from "next/navigation";

interface Notification {
    id: string;
    type: 'overdue_invoice' | 'expiring_quotation' | 'expired_quotation' | 'accepted_quotation' | 'new_document';
    title: string;
    message: string;
    date: string;
    link: string;
    priority: 'high' | 'medium' | 'low';
}

export const NotificationCenter = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const res = await fetch("/api/notifications");
                if (res.ok) {
                    const data = await res.json();
                    setNotifications(data);
                }
            } catch (error) {
                console.error("Failed to fetch notifications", error);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
        // Poll every 5 minutes
        const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const unreadCount = notifications.length;

    const getIcon = (type: string) => {
        switch (type) {
            case 'overdue_invoice': return <AlertCircle className="w-4 h-4 text-rose-500" />;
            case 'expiring_quotation': return <Clock className="w-4 h-4 text-amber-500" />;
            case 'expired_quotation': return <X className="w-4 h-4 text-slate-400" />;
            case 'accepted_quotation': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
            case 'new_document': return <FilePlus className="w-4 h-4 text-brand-primary" />;
            default: return <Bell className="w-4 h-4 text-brand-primary" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2 rounded-xl transition-all ${
                    isOpen ? 'bg-brand-50 text-brand-primary' : 'text-slate-400 hover:bg-slate-100'
                }`}
            >
                <Bell className="w-5 h-5 transition-transform group-hover:scale-110" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 text-white text-[10px] font-black items-center justify-center border-2 border-white">
                            {unreadCount}
                        </span>
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-2">
                            <h3 className="font-black text-slate-900 text-sm tracking-tight uppercase">Notifications</h3>
                            <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-100">
                                {unreadCount}
                            </span>
                        </div>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-50 no-scrollbar">
                        {loading ? (
                            <div className="p-8 text-center">
                                <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Checking status...</p>
                            </div>
                        ) : notifications.length > 0 ? (
                            notifications.map((n) => (
                                <div 
                                    key={n.id}
                                    onClick={() => {
                                        router.push(n.link);
                                        setIsOpen(false);
                                    }}
                                    className="p-4 hover:bg-slate-50 transition-colors cursor-pointer group relative"
                                >
                                    <div className="flex gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                            n.priority === 'high' ? 'bg-rose-50' : n.priority === 'medium' ? 'bg-amber-50' : 'bg-slate-100'
                                        }`}>
                                            {getIcon(n.type)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="font-bold text-slate-900 text-sm leading-tight group-hover:text-brand-primary transition-colors">{n.title}</h4>
                                                <span className="text-[9px] font-black text-slate-300 uppercase whitespace-nowrap ml-2">{n.date}</span>
                                            </div>
                                            <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-2">{n.message}</p>
                                            <div className="flex items-center gap-1 text-[9px] font-black text-brand-primary uppercase tracking-tighter group-hover:gap-2 transition-all">
                                                Take Action <ChevronRight className="w-3 h-3" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-12 text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Bell className="w-8 h-8 text-slate-300" />
                                </div>
                                <p className="text-sm font-bold text-slate-900 mb-1">All caught up!</p>
                                <p className="text-xs text-slate-400">No pending alerts for your projects.</p>
                            </div>
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="p-3 bg-slate-50/50 border-t border-slate-50">
                            <button 
                                onClick={() => {
                                    router.push('/dashboard');
                                    setIsOpen(false);
                                }}
                                className="w-full py-2.5 text-[10px] font-black text-slate-400 hover:text-brand-primary hover:bg-white rounded-xl uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-[0.98] border border-transparent hover:border-slate-100 shadow-sm hover:shadow-md"
                            >
                                <ChevronRight className="w-3 h-3" />
                                Go to Financial Overview
                                <ChevronRight className="w-3 h-3" />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
