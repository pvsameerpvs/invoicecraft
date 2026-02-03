"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { useMemo, useState, useEffect } from "react";
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from "recharts";
import { PlusCircle, FileText, TrendingUp, AlertCircle, CheckCircle, Percent, TrendingDown, RotateCcw, Filter, Calendar, ChevronRight, FilePlus2, Users, Activity, Clock, ArrowUpRight, Wallet, Award, Zap, ShieldCheck } from "lucide-react";

interface DashboardProps {
    onCreateInvoice: () => void;
    invoiceHistory?: any[]; 
}

// Hide scrollbar utility
const scrollbarHideStyles = `
    .no-scrollbar::-webkit-scrollbar {
        display: none;
    }
    .no-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
`;

const COLORS = ["#f97316", "#ef4444", "#22c55e"]; // Orange, Red, Green
type FilterType = 'monthly' | 'yearly' | 'all';

// Helper to format date as DD-MM-YYYY
function formatDate(dateStr?: string) {
    if (!dateStr) return " ";
    try {
       const [y, m, d] = dateStr.split("-");
       if (y && m && d) return `${d}-${m}-${y}`;
       return dateStr;
    } catch {
       return dateStr;
    }
}

import { Skeleton } from "./ui/skeleton";
import { useTheme } from "./ThemeProvider";
import { themes } from "../lib/themes";

export const DashboardContainer = ({ onCreateInvoice, invoiceHistory = [] }: DashboardProps) => {
    
    // --- Server Side Stats State ---
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // Theme Hook
    const { currentTheme } = useTheme();
    const theme = useMemo(() => themes.find(t => t.id === currentTheme) || themes[0], [currentTheme]);
    const brandColor = theme.colors.primary;

    // Initialize state from URL params
    const [filter, setFilter] = useState<FilterType>((searchParams.get('period') as FilterType) || 'monthly');
    const [year, setYear] = useState<number>(parseInt(searchParams.get('year') || new Date().getFullYear().toString()));
    const [month, setMonth] = useState<number>(parseInt(searchParams.get('month') || new Date().getMonth().toString()));

    // Update URL when filters change
    useEffect(() => {
        const params = new URLSearchParams(searchParams);
        params.set('period', filter);
        params.set('year', year.toString());
        params.set('month', month.toString());
        router.replace(`?${params.toString()}`, { scroll: false });
    }, [filter, year, month, router, searchParams]);

    const [stats, setStats] = useState({
        revenue: { value: 0, growth: 0 },
        invoices: { value: 0, growth: 0 },
        vat: { value: 0, growth: 0 },
        outstanding: { value: 0, count: 0, growth: 0 },
        paidInvoices: { value: 0, count: 0, growth: 0 },
        overdue: { count: 0, value: 0 }, // New Overdue Metrics
        quotations: { count: 0, value: 0, growth: 0 }, 
        acceptedQuotations: { count: 0, value: 0, growth: 0 }, // Added
        overdueQuotations: { count: 0, value: 0 }, 
        chartData: [] as any[],
        pieData: [] as any[],
        loading: true
    });

    // Fetch Stats on Filter Change
    useEffect(() => {
        const fetchStats = async () => {
            try {
                setStats(prev => ({ ...prev, loading: true }));
                const res = await fetch(`/api/dashboard-stats?period=${filter}&year=${year}&month=${month}`);
                if (res.ok) {
                    const data = await res.json();
                    setStats({ ...data, loading: false });
                }
            } catch (error) {
                console.error("Failed to fetch stats", error);
            }
        };
        fetchStats();
    }, [filter, year, month]);

    // Trigger Auto-Overdue Update on Mount
    useEffect(() => {
        fetch('/api/cron/update-overdue').catch(err => console.error("Auto-Overdue Check Failed", err));
    }, []);

    // Formatters
    const fmtMoney = (n: number) => new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(n);
    const fmtPerc = (n: number) => `${Math.abs(n).toFixed(1)}%`;

    // Helper for Growth Badge
    const GrowthBadge = ({ value }: { value: number }) => {
        if (filter === 'all') return null; // No growth for 'All' view usually
        const isPos = value > 0;
        const isNeg = value < 0;
        const colorClass = isPos ? "text-green-600 bg-green-50" : isNeg ? "text-red-600 bg-red-50" : "text-slate-500 bg-slate-100";
        const Icon = isPos ? TrendingUp : (isNeg ? TrendingDown : TrendingUp); // Icon choice

        return (
            <div className={`flex items-center gap-1 text-xs font-bold mt-2 px-2 py-1 rounded-lg w-fit ${colorClass}`}>
                <Icon className="w-3 h-3" />
                {isPos ? "+" : isNeg ? "-" : ""}{fmtPerc(value)} {filter === 'monthly' ? 'vs last month' : 'vs last year'}
            </div>
        );
    };

    // Use Paid Count from API
    const paidCount = (stats as any).paidInvoices?.count ?? 0;
    const paidGrowth = (stats as any).paidInvoices?.growth ?? 0;

    // --- CUSTOM BUSINESS INTELLIGENCE ---
    const businessMetrics = useMemo(() => {
        const clientsMap: Record<string, { value: number, count: number }> = {};
        const invs = invoiceHistory.filter(i => i.documentType !== "Quotation");
        
        invs.forEach(i => {
            const val = parseFloat(i.total) || 0;
            if (!clientsMap[i.clientName]) clientsMap[i.clientName] = { value: 0, count: 0 };
            clientsMap[i.clientName].value += val;
            clientsMap[i.clientName].count += 1;
        });
        
        const topClients = Object.entries(clientsMap)
            .map(([name, data]) => ({ name, value: data.value, count: data.count }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 4);

        const avgTicket = invs.length > 0 
            ? invs.reduce((acc, curr) => acc + (parseFloat(curr.total) || 0), 0) / invs.length 
            : 0;

        return { topClients, avgTicket, clientCount: Object.keys(clientsMap).length };
    }, [invoiceHistory]);

    return (
        <div className="flex-1 bg-[#fcfcfc] p-6 md:p-10 selection:bg-brand-100 selection:text-brand-900 font-sans">
            <style>{scrollbarHideStyles}</style>
            
            {/* Background Decorative Blobs */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-primary/5 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-end/5 rounded-full blur-[150px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto space-y-12">
                
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 md:gap-10">
                    <div className="space-y-2 text-center lg:text-left">
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight animate-in fade-in slide-in-from-left duration-1000">Dashboard</h1>
                        <p className="text-slate-500 font-medium text-base md:text-lg">Advanced financial telemetry and overview.</p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
                        <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/70 backdrop-blur-xl p-2 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/80">
                             
                             <div className="flex bg-slate-100/50 p-1.5 rounded-[1.8rem] w-full sm:w-auto">
                                {(['monthly', 'yearly', 'all'] as FilterType[]).map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={`flex-1 sm:flex-none px-6 py-2.5 text-[11px] font-black rounded-[1.4rem] uppercase tracking-wider transition-all ${
                                            filter === f 
                                            ? "bg-white text-slate-900 shadow-md scale-105" 
                                            : "text-slate-400 hover:text-slate-600"
                                        }`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>

                            <div className="hidden sm:block w-px h-10 bg-slate-200/50"></div>

                            {filter !== 'all' && (
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <div className="relative flex-1 sm:flex-none group">
                                        <Calendar className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-hover:text-brand-primary transition-colors" />
                                        <select 
                                            value={year} 
                                            onChange={(e) => setYear(parseInt(e.target.value))}
                                            className="w-full sm:w-auto pl-10 pr-10 py-3 bg-slate-100/50 hover:bg-white border border-transparent hover:border-slate-200 rounded-[1.5rem] text-[11px] font-black text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all appearance-none cursor-pointer"
                                        >
                                            {[2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                                                <option key={y} value={y}>{y}</option>
                                            ))}
                                        </select>
                                        <ChevronRight className="w-3 h-3 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 rotate-90" />
                                    </div>

                                    {filter === 'monthly' && (
                                        <div className="relative flex-1 sm:flex-none group">
                                            <select 
                                                value={month} 
                                                onChange={(e) => setMonth(parseInt(e.target.value))}
                                                className="w-full sm:w-auto pl-5 pr-10 py-3 bg-slate-100/50 hover:bg-white border border-transparent hover:border-slate-200 rounded-[1.5rem] text-[11px] font-black text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all appearance-none cursor-pointer min-w-[150px]"
                                            >
                                                {Array.from({ length: 12 }, (_, i) => (
                                                    <option key={i} value={i}>
                                                        {new Date(0, i).toLocaleString('default', { month: 'long' }).toUpperCase()}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronRight className="w-3 h-3 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 rotate-90" />
                                        </div>
                                    )}
                                </div>
                            )}

                             <button 
                                onClick={() => {
                                    const now = new Date();
                                    setFilter('monthly');
                                    setYear(now.getFullYear());
                                    setMonth(now.getMonth());
                                }}
                                className="p-3 text-slate-400 hover:text-brand-primary hover:bg-brand-50 rounded-full transition-all active:rotate-[-45deg]"
                                title="Reset Data"
                             >
                                <RotateCcw className="w-5 h-5" />
                             </button>
                        </div>

                        <div className="flex flex-wrap items-center justify-center lg:justify-end gap-3 md:gap-4">
                            <button 
                                onClick={() => router.push("/invoice?type=Quotation")}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 md:gap-3 bg-white text-slate-900 border border-slate-100 px-6 md:px-8 py-3 md:py-4 rounded-[1.5rem] md:rounded-[1.8rem] text-[10px] md:text-[11px] font-black uppercase tracking-widest shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-1 active:scale-95 transition-all"
                            >
                                <PlusCircle className="w-3.5 h-3.5 md:w-4 h-4 text-brand-primary" />
                                Quotation
                            </button>

                            <button 
                                onClick={onCreateInvoice}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 md:gap-3 bg-slate-900 text-white px-6 md:px-8 py-3 md:py-4 rounded-[1.5rem] md:rounded-[1.8rem] text-[10px] md:text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-slate-900/20 hover:bg-slate-800 hover:-translate-y-1 active:scale-95 transition-all group"
                            >
                                <PlusCircle className="w-3.5 h-3.5 md:w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
                                Invoice
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2. Elite Stats Slider (8 Cards) */}
                <div className="flex overflow-x-auto pb-6 gap-6 no-scrollbar snap-x scroll-smooth">
                    {/* Total Revenue */}
                    <div className="min-w-[320px] flex-shrink-0 bg-white/70 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative overflow-hidden group snap-center hover:scale-[1.02] transition-all duration-500">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full translate-x-12 -translate-y-12 blur-2xl group-hover:scale-150 transition-transform duration-700" />
                        <div className="flex items-start justify-between mb-8 relative z-10">
                            <div className="p-4 bg-brand-50 text-brand-primary rounded-2xl shadow-inner group-hover:scale-110 transition-transform">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <div className="text-right">
                                {!stats.loading && <GrowthBadge value={stats.revenue.growth} />}
                            </div>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 relative z-10">Portfolio Revenue</p>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none relative z-10">
                            {stats.loading ? <Skeleton className="h-9 w-32" /> : fmtMoney(stats.revenue.value)}
                        </h3>
                    </div>

                    {/* Total Paid Invoices */}
                    <div className="min-w-[320px] flex-shrink-0 bg-white/70 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative overflow-hidden group snap-center hover:scale-[1.02] transition-all duration-500">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full translate-x-12 -translate-y-12 blur-2xl group-hover:scale-150 transition-transform duration-700" />
                        <div className="flex items-start justify-between mb-8 relative z-10">
                            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl shadow-inner group-hover:scale-110 transition-transform">
                                <CheckCircle className="w-6 h-6" />
                            </div>
                            <div className="text-right">
                                {!stats.loading && <GrowthBadge value={paidGrowth} />}
                            </div>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 relative z-10">Settled Assets</p>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none relative z-10">
                            {stats.loading ? <Skeleton className="h-9 w-24" /> : paidCount}
                        </h3>
                    </div>

                    {/* VAT Amount */}
                    <div className="min-w-[320px] flex-shrink-0 bg-white/70 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative overflow-hidden group snap-center hover:scale-[1.02] transition-all duration-500">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full translate-x-12 -translate-y-12 blur-2xl group-hover:scale-150 transition-transform duration-700" />
                        <div className="flex items-start justify-between mb-8 relative z-10">
                            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl shadow-inner group-hover:scale-110 transition-transform">
                                <Percent className="w-6 h-6" />
                            </div>
                            <div className="text-right">
                                {!stats.loading && <GrowthBadge value={stats.vat.growth} />}
                            </div>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 relative z-10">Fiscal Contribution</p>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none relative z-10">
                            {stats.loading ? <Skeleton className="h-9 w-24" /> : fmtMoney(stats.vat.value)}
                        </h3>
                    </div>

                    {/* Total Unpaid Invoices */}
                    <div className="min-w-[320px] flex-shrink-0 bg-white/70 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative overflow-hidden group snap-center hover:scale-[1.02] transition-all duration-500">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full translate-x-12 -translate-y-12 blur-2xl group-hover:scale-150 transition-transform duration-700" />
                        <div className="flex items-start justify-between mb-8 relative z-10">
                            <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl shadow-inner group-hover:scale-110 transition-transform">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <div className="text-right">
                                {!stats.loading && <GrowthBadge value={stats.outstanding.growth} />}
                            </div>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 relative z-10">Market Exposure</p>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none relative z-10">
                            {stats.loading ? <Skeleton className="h-9 w-32" /> : fmtMoney(stats.outstanding.value)}
                        </h3>
                    </div>

                    {/* Total Overdue Invoices */}
                    <div className="min-w-[320px] flex-shrink-0 bg-white/70 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative overflow-hidden group snap-center hover:scale-[1.02] transition-all duration-500">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full translate-x-12 -translate-y-12 blur-2xl group-hover:scale-150 transition-transform duration-700" />
                        <div className="flex items-start justify-between mb-8 relative z-10">
                            <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl shadow-inner group-hover:scale-110 transition-transform">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <div className="text-right px-3 py-1 bg-rose-100 rounded-lg text-[9px] font-black text-rose-700 uppercase">Critical</div>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 relative z-10">Delinquent Assets</p>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none relative z-10">
                            {stats.loading ? <Skeleton className="h-9 w-32" /> : fmtMoney(stats.overdue.value)}
                        </h3>
                    </div>

                    {/* Total Quotations */}
                    <div className="min-w-[320px] flex-shrink-0 bg-white/70 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative overflow-hidden group snap-center hover:scale-[1.02] transition-all duration-500">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-500/5 rounded-full translate-x-12 -translate-y-12 blur-2xl group-hover:scale-150 transition-transform duration-700" />
                        <div className="flex items-start justify-between mb-8 relative z-10">
                            <div className="p-4 bg-slate-50 text-slate-600 rounded-2xl shadow-inner group-hover:scale-110 transition-transform">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div className="text-right">
                                {!stats.loading && <GrowthBadge value={stats.quotations.growth} />}
                            </div>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 relative z-10">Proposal Pipeline</p>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none relative z-10">
                            {stats.loading ? <Skeleton className="h-9 w-32" /> : stats.quotations.count}
                        </h3>
                    </div>

                    {/* Accepted Quotations (Conversion) */}
                    <div className="min-w-[320px] flex-shrink-0 bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group snap-center hover:scale-[1.02] transition-all duration-500 focus-within:ring-2 focus-within:ring-brand-primary">
                        <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-brand-primary/20 rounded-full blur-[60px] group-hover:scale-150 transition-transform duration-700" />
                        <div className="flex items-start justify-between mb-8 relative z-10">
                            <div className="p-4 bg-white/10 text-white rounded-2xl shadow-lg backdrop-blur-md group-hover:rotate-12 transition-transform">
                                <Zap className="w-6 h-6 text-brand-primary fill-brand-primary" />
                            </div>
                            <div className="text-right">
                                <div className="px-3 py-1 bg-brand-primary text-white text-[9px] font-black rounded-lg uppercase tracking-wider animate-pulse whitespace-nowrap">Conversion Elite</div>
                            </div>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 relative z-10">Yield Performance</p>
                        <h3 className="text-3xl font-black text-white tracking-tighter leading-none relative z-10">
                            {stats.loading ? <Skeleton className="h-9 w-20 bg-white/20" /> : (stats as any).acceptedQuotations?.count || 0}
                            <span className="text-xs font-bold text-brand-primary ml-2 uppercase">Success rate: {stats.quotations.count > 0 ? (((stats as any).acceptedQuotations?.count || 0) / stats.quotations.count * 100).toFixed(0) : 0}%</span>
                        </h3>
                    </div>

                    {/* Total Overdue Quotations */}
                    <div className="min-w-[320px] flex-shrink-0 bg-white/70 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative overflow-hidden group snap-center hover:scale-[1.02] transition-all duration-500">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full translate-x-12 -translate-y-12 blur-2xl group-hover:scale-150 transition-transform duration-700" />
                        <div className="flex items-start justify-between mb-8 relative z-10">
                            <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl shadow-inner group-hover:scale-110 transition-transform">
                                <Clock className="w-6 h-6" />
                            </div>
                             <div className="text-right px-3 py-1 bg-amber-100 rounded-lg text-[9px] font-black text-amber-700 uppercase">Attention</div>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 relative z-10">Pipeline Stagnation</p>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none relative z-10">
                            {stats.loading ? <Skeleton className="h-9 w-32" /> : fmtMoney(stats.overdueQuotations.value)}
                        </h3>
                    </div>
                </div>

                {/* 3. Executive Insights Strip */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    <div className="bg-slate-900 rounded-[2rem] p-6 md:p-8 text-white flex items-center justify-between group overflow-hidden relative shadow-2xl">
                         <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/20 rounded-full -translate-x-12 -translate-y-12 blur-2xl group-hover:scale-150 transition-transform duration-700" />
                         <div className="relative z-10">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Average Transmission</p>
                            <h4 className="text-2xl md:text-3xl font-black tracking-tighter leading-none">{fmtMoney(businessMetrics.avgTicket)}</h4>
                         </div>
                         <div className="p-3 md:p-4 bg-white/10 rounded-2xl relative z-10 border border-white/5 backdrop-blur-md group-hover:bg-brand-primary transition-colors">
                            <Wallet className="w-5 h-5 md:w-6 h-6 text-brand-primary group-hover:text-white transition-colors" />
                         </div>
                    </div>

                    <div className="bg-white/70 backdrop-blur-xl border border-white rounded-[2rem] p-6 md:p-8 flex items-center justify-between group shadow-sm hover:shadow-xl transition-all">
                         <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Partner Ecosystem</p>
                            <h4 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter leading-none">{businessMetrics.clientCount} <span className="text-xs font-bold text-slate-400 ml-1">Entities</span></h4>
                         </div>
                         <div className="p-3 md:p-4 bg-brand-50 rounded-2xl group-hover:bg-brand-primary group-hover:text-white transition-all duration-300">
                            <Users className="w-5 h-5 md:w-6 h-6" />
                         </div>
                    </div>

                    <div className="bg-white/70 backdrop-blur-xl border border-white rounded-[2rem] p-6 md:p-8 flex items-center justify-between group shadow-sm hover:shadow-xl transition-all md:col-span-2 lg:col-span-1">
                         <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Success Velocity</p>
                            <h4 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter leading-none">
                                {(((stats as any).acceptedQuotations?.count || 0) / (stats.quotations.count || 1) * 100).toFixed(0)}%
                                <span className="text-xs font-bold text-slate-400 ml-1">Yield</span>
                            </h4>
                         </div>
                         <div className="p-3 md:p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                            <TrendingUp className="w-5 h-5 md:w-6 h-6" />
                         </div>
                    </div>
                </div>

                {/* 4. Deep Analytics & Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
                    {/* Main Chart */}
                    <div className="lg:col-span-8 bg-white/70 backdrop-blur-xl p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.02)] group">
                        <div className="flex items-center justify-between mb-8 md:mb-10">
                            <div>
                                <h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">Revenue Analytics</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Growth progression over period</p>
                            </div>
                            <div className="p-2.5 md:p-3 bg-slate-50 rounded-xl text-slate-400 group-hover:text-brand-primary transition-colors">
                                <TrendingUp className="w-4 h-4 md:w-5 h-5" />
                            </div>
                        </div>
                        <div className="h-[300px] md:h-[360px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={brandColor} stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor={brandColor} stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="10 10" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} dy={20} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} tickFormatter={(val) => `AED ${val}`} dx={-10} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.2)' }}
                                        itemStyle={{ color: '#fff', fontSize: '11px md:12px', fontWeight: 'bold' }}
                                        labelStyle={{ color: '#64748b', fontSize: '9px md:10px', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 'black' }}
                                    />
                                    <Area type="monotone" dataKey="revenue" stroke={brandColor} strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" animationDuration={2000} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    
                    {/* Status Distribution */}
                    <div className="lg:col-span-4 bg-white/70 backdrop-blur-xl p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col">
                        <div className="flex items-center justify-between mb-8 md:mb-10">
                            <div>
                                <h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">Status Engine</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Volume distribution</p>
                            </div>
                        </div>
                        <div className="flex-1 min-h-[220px] md:min-h-[240px]">
                           <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={85}
                                        paddingAngle={8}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {stats.pieData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '9px md:10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '20px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* 5. Document Management Matrix */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 md:gap-10">
                    {/* Recent Invoices */}
                    <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] md:rounded-[3rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden flex flex-col">
                        <div className="px-6 md:px-10 py-7 md:py-10 border-b border-slate-50 flex items-center justify-between bg-white/20">
                            <div>
                                <h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">Recent Invoices</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-500 rounded-full animate-pulse" />
                                    <p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Verified Ledger</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => router.push('/history')}
                                className="h-10 md:h-12 px-6 md:px-8 bg-slate-900 text-white rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-900/10"
                            >
                                View All
                            </button>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {invoiceHistory.filter(i => i.documentType !== "Quotation").slice(0, 5).map((invoice, i) => (
                                <div key={i} className="flex items-center justify-between px-6 md:px-10 py-5 md:py-7 hover:bg-slate-50/50 transition-all cursor-pointer group" onClick={() => router.push(`/invoice/edit/${invoice.invoiceNumber}`)}>
                                    <div className="flex items-center gap-4 md:gap-6 min-w-0">
                                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-[1rem] md:rounded-[1.2rem] bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-brand-primary group-hover:text-white transition-all shadow-sm flex-shrink-0">
                                            <FileText className="w-6 h-6 md:w-7 md:h-7" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-0.5 md:mb-1">
                                                <p className="font-black text-slate-900 text-sm md:text-base tracking-tight truncate">INV-{invoice.invoiceNumber}</p>
                                                {(() => {
                                                    try {
                                                        const p = JSON.parse(invoice.payloadJson || "{}");
                                                        if (p.sourceQuotation) {
                                                            return (
                                                                <span className="bg-brand-50 text-brand-primary text-[7px] md:text-[8px] font-black px-1.5 md:px-2 py-0.5 rounded-md uppercase tracking-widest border border-brand-100 hidden sm:inline-block" title={`Derived from ${p.sourceQuotation}`}>
                                                                    LINKED
                                                                </span>
                                                            );
                                                        }
                                                    } catch(e) {}
                                                    return null;
                                                })()}
                                            </div>
                                            <p 
                                                className="text-[10px] md:text-[11px] text-slate-400 font-black uppercase tracking-widest hover:text-brand-primary transition-colors truncate"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/clients/${encodeURIComponent(invoice.clientName)}`);
                                                }}
                                            >
                                                {invoice.clientName}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0 ml-4">
                                        <p className="font-black text-slate-900 text-lg md:text-xl tracking-tighter leading-none">{invoice.currency} {invoice.total}</p>
                                        <span className={`inline-flex items-center gap-1 md:gap-1.5 text-[8px] md:text-[9px] uppercase font-black px-2 md:px-3 py-1 rounded-full mt-1.5 md:mt-2 ${
                                            invoice.status === 'Paid' ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
                                        }`}>
                                            {invoice.status === 'Paid' ? <CheckCircle className="w-2.5 h-2.5 md:w-3 h-3" /> : <AlertCircle className="w-2.5 h-2.5 md:w-3 h-3" />}
                                            {invoice.status || 'Unpaid'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {invoiceHistory.filter(i => i.documentType !== "Quotation").length === 0 && (
                                <div className="px-6 md:px-10 py-16 md:py-24 text-center">
                                    <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FileText className="w-6 h-6 md:w-8 md:h-8 text-slate-200" />
                                    </div>
                                    <p className="text-slate-400 font-black uppercase text-[9px] md:text-[10px] tracking-widest">No recent transmissions</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Quotations */}
                    <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] md:rounded-[3rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden flex flex-col">
                         <div className="px-6 md:px-10 py-7 md:py-10 border-b border-slate-50 flex items-center justify-between bg-white/20">
                            <div>
                                <h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">Technical Proposals</h3>
                                <p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Pipeline Analytics</p>
                            </div>
                            <button 
                                onClick={() => router.push('/quotations')}
                                className="h-10 md:h-12 px-6 md:px-8 bg-slate-900 text-white rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-900/10"
                            >
                                All Quotes
                            </button>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {invoiceHistory.filter(i => i.documentType === "Quotation").slice(0, 5).map((q, i) => (
                                <div key={i} className="flex items-center justify-between px-6 md:px-10 py-5 md:py-7 hover:bg-slate-50/50 transition-all cursor-pointer group" onClick={() => router.push(`/invoice/edit/${q.invoiceNumber}?type=Quotation`)}>
                                    <div className="flex items-center gap-4 md:gap-6 min-w-0">
                                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-[1rem] md:rounded-[1.2rem] bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-sm flex-shrink-0">
                                            <FileText className="w-6 h-6 md:w-7 md:h-7" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-0.5 md:mb-1">
                                                <p className="font-black text-slate-900 text-sm md:text-base tracking-tight truncate">QTN-{q.quotationNumber}</p>
                                                {(() => {
                                                    try {
                                                        const p = JSON.parse(q.payloadJson || "{}");
                                                        if (p.convertedToInvoice) {
                                                            return (
                                                                <span className="bg-emerald-50 text-emerald-600 text-[7px] md:text-[8px] font-black px-1.5 md:px-2 py-0.5 rounded-md uppercase tracking-widest border border-emerald-100 hidden sm:inline-block" title={`Invoiced as ${p.convertedToInvoice}`}>
                                                                    CONVERTED
                                                                </span>
                                                            );
                                                        }
                                                    } catch(e) {}
                                                    return null;
                                                })()}
                                            </div>
                                            <p 
                                                className="text-[10px] md:text-[11px] text-slate-400 font-black uppercase tracking-widest hover:text-brand-primary transition-colors truncate"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/clients/${encodeURIComponent(q.clientName)}`);
                                                }}
                                            >
                                                {q.clientName}
                                            </p>
                                            {q.validityDate && q.status?.toLowerCase() !== 'accepted' && (
                                                <div className="flex items-center gap-2 mt-1.5 md:mt-2">
                                                    <span className="text-[8px] md:text-[9px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 px-1.5 md:px-2 py-0.5 rounded truncate max-w-[150px]">Expires {formatDate(q.validityDate)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end flex-shrink-0 ml-4">
                                        <p className="font-black text-slate-900 text-lg md:text-xl tracking-tighter leading-none">{q.currency} {q.total}</p>
                                        <div className="flex items-center gap-2 md:gap-3 mt-2 md:mt-3">
                                            {(() => {
                                                try {
                                                    const p = JSON.parse(q.payloadJson || "{}");
                                                    if (!p.convertedToInvoice && (q.status === 'Accepted' || q.status === 'Pending')) {
                                                        return (
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    router.push(`/invoice?convertFrom=${q.invoiceNumber}&client=${encodeURIComponent(q.clientName)}`);
                                                                }}
                                                                className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-1 md:py-1.5 bg-brand-primary text-white text-[8px] md:text-[9px] font-black rounded-lg uppercase tracking-widest hover:shadow-lg hover:shadow-brand-primary/20 transition-all active:scale-95"
                                                            >
                                                                <FilePlus2 className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                                                Convert
                                                            </button>
                                                        );
                                                    }
                                                } catch(e) {}
                                                return null;
                                            })()}
                                            <span className={`inline-flex items-center gap-1 md:gap-1.5 text-[8px] md:text-[9px] uppercase font-black px-2 md:px-3 py-1 rounded-full ${
                                                q.status === 'Accepted' ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'
                                            }`}>
                                                {q.status === 'Accepted' ? <CheckCircle className="w-2.5 h-2.5 md:w-3 h-3" /> : <Clock className="w-2.5 h-2.5 md:w-3 h-3" />}
                                                {q.status || 'Draft'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                             {invoiceHistory.filter(i => i.documentType === "Quotation").length === 0 && (
                                <div className="px-6 md:px-10 py-16 md:py-24 text-center">
                                    <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FileText className="w-6 h-6 md:w-8 md:h-8 text-slate-200" />
                                    </div>
                                    <p className="text-slate-400 font-black uppercase text-[9px] md:text-[10px] tracking-widest">No active proposals</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 6. Institutional Ledger: Top Clients */}
                <div className="lg:col-span-12 bg-white/70 backdrop-blur-xl rounded-[2.5rem] md:rounded-[3rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden flex flex-col mb-10">
                    <div className="px-6 md:px-10 py-7 md:py-10 border-b border-slate-50 flex items-center justify-between bg-white/20">
                        <div className="flex items-center gap-3 md:gap-4">
                            <div className="p-3 md:p-4 bg-slate-900 text-white rounded-[1rem] md:rounded-[1.2rem] shadow-xl">
                                <ShieldCheck className="w-5 h-5 md:w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">Institutional Ledger</h3>
                                <p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Top performing entities</p>
                            </div>
                        </div>
                        <div className="flex -space-x-3 hidden sm:flex">
                             {businessMetrics.topClients.slice(0, 5).map((c, i) => (
                                <div key={i} className="w-8 h-8 md:w-10 md:h-10 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center text-[9px] md:text-[10px] font-black text-slate-400">
                                    {c.name.charAt(0)}
                                </div>
                             ))}
                        </div>
                    </div>
                    <div className="p-6 md:p-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 flex-1">
                        {businessMetrics.topClients.map((client, i) => (
                            <div key={i} className="group relative">
                                <div className="flex items-center gap-4 md:gap-5 mb-6 md:mb-8">
                                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-[1rem] md:rounded-[1.2rem] bg-slate-50 border border-slate-100 text-slate-900 flex items-center justify-center text-lg md:text-xl font-black shadow-sm group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 group-hover:-translate-y-2">
                                        {client.name.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p 
                                            className="font-black text-slate-900 text-sm md:text-base truncate uppercase tracking-tight group-hover:text-brand-primary transition-colors cursor-pointer"
                                            onClick={() => router.push(`/clients/${encodeURIComponent(client.name)}`)}
                                        >
                                            {client.name}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-brand-primary rounded-full" />
                                            <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">{client.count} Transmissions</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3 md:space-y-4">
                                    <div className="flex items-end justify-between">
                                        <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenue Impact</span>
                                        <span className="text-base md:text-lg font-black text-slate-900 tracking-tighter">{fmtMoney(client.value)}</span>
                                    </div>
                                    <div className="h-2 md:h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-slate-900 rounded-full group-hover:bg-brand-primary transition-all duration-1000"
                                            style={{ width: `${Math.min((client.value / (businessMetrics.topClients[0]?.value || 1)) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <button 
                        onClick={() => router.push('/clients')}
                        className="w-full py-8 md:py-10 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] text-slate-400 hover:text-brand-primary hover:bg-slate-50 transition-all border-t border-slate-50"
                    >
                        Access Full Portfolio Directory
                    </button>
                </div>

            </div>
        </div>
    );
};
