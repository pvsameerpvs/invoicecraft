"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { useMemo, useState, useEffect } from "react";
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from "recharts";
import { PlusCircle, FileText, TrendingUp, AlertCircle, CheckCircle, Percent, TrendingDown, RotateCcw, Filter, Calendar, ChevronRight } from "lucide-react";

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

    return (
        <div className="flex-1 bg-slate-50 p-4 md:p-8 overflow-y-auto">
            <style>{scrollbarHideStyles}</style>
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Header & Filter */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
                        <p className="text-slate-500">Welcome back, here is your financial overview.</p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                        {/* Improved Filter Toolbar */}
                        <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
                             
                             {/* Period Toggles */}
                             <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
                                {(['monthly', 'yearly', 'all'] as FilterType[]).map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-bold rounded-lg capitalize transition-all ${
                                            filter === f 
                                            ? "bg-white text-slate-900 shadow-sm ring-1 ring-black/5" 
                                            : "text-slate-500 hover:text-slate-900"
                                        }`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>

                            <div className="w-full h-px sm:w-px sm:h-8 bg-slate-100 sm:bg-slate-200"></div>

                            {/* Date Selectors */}
                            {filter !== 'all' && (
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <div className="relative flex-1 sm:flex-none">
                                        <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        <select 
                                            value={year} 
                                            onChange={(e) => setYear(parseInt(e.target.value))}
                                            className="w-full sm:w-auto pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-100 border border-transparent hover:border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all appearance-none cursor-pointer"
                                        >
                                            {[2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                                                <option key={y} value={y}>{y}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {filter === 'monthly' && (
                                        <div className="relative flex-1 sm:flex-none">
                                            <select 
                                                value={month} 
                                                onChange={(e) => setMonth(parseInt(e.target.value))}
                                                className="w-full sm:w-auto pl-4 pr-8 py-2 bg-slate-50 hover:bg-slate-100 border border-transparent hover:border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all appearance-none cursor-pointer min-w-[140px]"
                                            >
                                                {Array.from({ length: 12 }, (_, i) => (
                                                    <option key={i} value={i}>
                                                        {new Date(0, i).toLocaleString('default', { month: 'long' })}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            )}

                             {/* Reset Button */}
                             <button 
                                onClick={() => {
                                    const now = new Date();
                                    setFilter('monthly');
                                    setYear(now.getFullYear());
                                    setMonth(now.getMonth());
                                }}
                                className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors"
                                title="Reset Filters"
                             >
                                <RotateCcw className="w-4 h-4" />
                             </button>
                        </div>

                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => router.push("/invoice?type=Quotation")}
                                className="flex items-center justify-center gap-2 bg-white text-slate-900 border border-slate-200 px-5 py-2.5 rounded-xl font-bold shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
                            >
                                <PlusCircle className="w-5 h-5 text-brand-primary" />
                                <span className="inline">Create Quotation</span>
                            </button>

                            <button 
                                onClick={onCreateInvoice}
                                className="flex items-center justify-center gap-2 bg-brand-primary text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-brand-primary/20 hover:bg-brand-end active:scale-95 transition-all"
                            >
                                <PlusCircle className="w-5 h-5" />
                                <span className="inline">Create Invoice</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Slider */}
                <div className="flex overflow-x-auto pb-4 gap-6 no-scrollbar snap-x">
                    {/* Total Revenue */}
                    <div className="min-w-[320px] flex-shrink-0 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between snap-center">
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">Total Revenue</p>
                            <h3 className="text-3xl font-extrabold text-slate-900">
                                {stats.loading ? <Skeleton className="h-9 w-32" /> : fmtMoney(stats.revenue.value)}
                            </h3>
                            {!stats.loading ? <GrowthBadge value={stats.revenue.growth} /> : <Skeleton className="h-6 w-24 mt-2 rounded-lg" />}
                        </div>
                        <div className="p-3 bg-brand-50 text-brand-600 rounded-xl">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                    </div>

                    {/* Total Paid Invoices */}
                    <div className="min-w-[320px] flex-shrink-0 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between snap-center">
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">Total Paid Invoices</p>
                            <h3 className="text-3xl font-extrabold text-slate-900">
                                {stats.loading ? <Skeleton className="h-9 w-24" /> : paidCount}
                            </h3>
                            
                             {!stats.loading ? <GrowthBadge value={paidGrowth} /> : <Skeleton className="h-6 w-24 mt-2 rounded-lg" />}
                        </div>
                        <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                    </div>

                    {/* VAT Amount */}
                    <div className="min-w-[320px] flex-shrink-0 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between snap-center">
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">Tax Amount (5%)</p>
                             <h3 className="text-3xl font-extrabold text-slate-900">
                                {stats.loading ? <Skeleton className="h-9 w-24" /> : fmtMoney(stats.vat.value)}
                            </h3>
                             {!stats.loading ? <GrowthBadge value={stats.vat.growth} /> : <Skeleton className="h-6 w-24 mt-2 rounded-lg" />}
                        </div>
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Percent className="w-6 h-6" />
                        </div>
                    </div>

                    {/* Total Unpaid Invoices */}
                    <div className="min-w-[320px] flex-shrink-0 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between snap-center">
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">Total Unpaid Invoices</p>
                            <h3 className="text-3xl font-extrabold text-slate-900">
                                {stats.loading ? <Skeleton className="h-9 w-32" /> : fmtMoney(stats.outstanding.value)}
                            </h3>
                             <p className="text-xs font-bold text-slate-500 mt-1">
                                {stats.loading ? <Skeleton className="h-3 w-20" /> : `${stats.outstanding.count} Invoices`}
                            </p>
                            {!stats.loading ? <GrowthBadge value={stats.outstanding.growth} /> : <Skeleton className="h-6 w-24 mt-2 rounded-lg" />}
                        </div>
                        <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                    </div>

                    {/* Total Overdue Invoices */}
                    <div className="min-w-[320px] flex-shrink-0 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between snap-center">
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">Total Overdue Invoices</p>
                            <h3 className="text-3xl font-extrabold text-slate-900">
                                {stats.loading ? <Skeleton className="h-9 w-32" /> : fmtMoney(stats.overdue.value)}
                            </h3>
                            <p className="text-xs font-bold text-red-500 mt-1">
                                {stats.loading ? <Skeleton className="h-3 w-20" /> : `${stats.overdue.count} Overdue`}
                            </p>
                        </div>
                        <div className="p-3 bg-red-100 text-red-700 rounded-xl">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                    </div>

                    {/* Total Quotations */}
                    <div className="min-w-[320px] flex-shrink-0 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between snap-center">
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">Total Quotations</p>
                            <h3 className="text-3xl font-extrabold text-slate-900">
                                {stats.loading ? <Skeleton className="h-9 w-32" /> : stats.quotations.count}
                            </h3>
                            <p className="text-xs font-bold text-slate-400 mt-1">
                                {stats.loading ? <Skeleton className="h-3 w-20" /> : `Value: ${fmtMoney(stats.quotations.value)}`}
                            </p>
                            {!stats.loading ? <GrowthBadge value={stats.quotations.growth} /> : <Skeleton className="h-6 w-24 mt-2 rounded-lg" />}
                        </div>
                        <div className="p-3 bg-slate-100 text-slate-600 rounded-xl">
                            <FileText className="w-6 h-6" />
                        </div>
                    </div>

                    {/* Accepted Quotations (Conversion) */}
                    <div className="min-w-[320px] flex-shrink-0 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between snap-center">
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">Accepted Quotations</p>
                            <h3 className="text-3xl font-extrabold text-slate-900">
                                {stats.loading ? <Skeleton className="h-9 w-32" /> : (stats as any).acceptedQuotations?.count || 0}
                            </h3>
                            <p className="text-xs font-bold text-emerald-600 mt-1">
                                {stats.loading ? <Skeleton className="h-3 w-20" /> : `Conversion: ${stats.quotations.count > 0 ? (((stats as any).acceptedQuotations?.count || 0) / stats.quotations.count * 100).toFixed(0) : 0}%`}
                            </p>
                            {!stats.loading ? <GrowthBadge value={(stats as any).acceptedQuotations?.growth || 0} /> : <Skeleton className="h-6 w-24 mt-2 rounded-lg" />}
                        </div>
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                    </div>

                    {/* Total Overdue Quotations */}
                    <div className="min-w-[320px] flex-shrink-0 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between snap-center">
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">Overdue Quotations</p>
                            <h3 className="text-3xl font-extrabold text-slate-900">
                                {stats.loading ? <Skeleton className="h-9 w-32" /> : fmtMoney(stats.overdueQuotations.value)}
                            </h3>
                            <p className="text-xs font-bold text-red-500 mt-1">
                                {stats.loading ? <Skeleton className="h-3 w-20" /> : `${stats.overdueQuotations.count} Expired`}
                            </p>
                        </div>
                        <div className="p-3 bg-red-50 text-rose-600 rounded-xl">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Charts Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Chart */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="text-lg font-bold text-slate-900 mb-6">Revenue Analytics</h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={brandColor} stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor={brandColor} stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => `AED ${val}`} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: 'none', color: '#f8fafc' }}
                                        itemStyle={{ color: '#f8fafc' }}
                                    />
                                    <Area type="monotone" dataKey="revenue" stroke={brandColor} strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    
                    {/* Status Distribution */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="text-lg font-bold text-slate-900 mb-6">Invoice Status</h3>
                        <div className="h-[300px] w-full">
                           <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {stats.pieData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Invoices & Quotations Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {/* Recent Invoices */}
                    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                            <div>
                                <h3 className="font-black text-slate-900 tracking-tight">Recent Invoices</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Standard Billing</p>
                            </div>
                            <button 
                                onClick={() => router.push('/history')}
                                className="text-xs font-black text-brand-primary hover:text-brand-end flex items-center gap-1 group"
                            >
                                VIEW ALL
                                <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                            </button>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {invoiceHistory.filter(i => i.documentType !== "Quotation").slice(0, 5).map((invoice, i) => (
                                <div key={i} className="flex items-center justify-between px-8 py-5 hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => router.push(`/invoice/edit/${invoice.invoiceNumber}`)}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-brand-50 group-hover:text-brand-primary transition-colors">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-slate-900 text-sm whitespace-nowrap">Invoice #{invoice.invoiceNumber}</p>
                                                {(() => {
                                                    try {
                                                        const p = JSON.parse(invoice.payloadJson || "{}");
                                                        if (p.sourceQuotation) {
                                                            return (
                                                                <span className="bg-brand-50 text-brand-primary text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter" title={`From ${p.sourceQuotation}`}>
                                                                    LINKED
                                                                </span>
                                                            );
                                                        }
                                                    } catch(e) {}
                                                    return null;
                                                })()}
                                            </div>
                                            <p 
                                                className="text-[10px] text-slate-400 font-bold uppercase hover:text-brand-primary transition-colors"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/clients/${encodeURIComponent(invoice.clientName)}`);
                                                }}
                                            >
                                                {invoice.clientName}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-slate-900 text-sm">{invoice.currency} {invoice.total}</p>
                                        <span className={`inline-flex items-center gap-1 text-[9px] uppercase font-black px-2 py-0.5 rounded-full mt-1 ${
                                            invoice.status === 'Paid' ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'
                                        }`}>
                                            {invoice.status === 'Paid' ? <CheckCircle className="w-2.5 h-2.5" /> : <AlertCircle className="w-2.5 h-2.5" />}
                                            {invoice.status || 'Unpaid'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {invoiceHistory.filter(i => i.documentType !== "Quotation").length === 0 && (
                                <div className="px-8 py-16 text-center text-slate-400 font-bold text-sm">
                                    No recent invoices.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Quotations */}
                    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                         <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                            <div>
                                <h3 className="font-black text-slate-900 tracking-tight">Recent Quotations</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Price Proposals</p>
                            </div>
                            <button 
                                onClick={() => router.push('/quotations')}
                                className="text-xs font-black text-brand-primary hover:text-brand-end flex items-center gap-1 group"
                            >
                                VIEW ALL
                                <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                            </button>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {invoiceHistory.filter(i => i.documentType === "Quotation").slice(0, 5).map((q, i) => (
                                <div key={i} className="flex items-center justify-between px-8 py-5 hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => router.push(`/invoice/edit/${q.invoiceNumber}?type=Quotation`)}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-brand-50 group-hover:text-amber-600 transition-colors">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-slate-900 text-sm whitespace-nowrap">Number #{q.quotationNumber}</p>
                                                {(() => {
                                                    try {
                                                        const p = JSON.parse(q.payloadJson || "{}");
                                                        if (p.convertedToInvoice) {
                                                            return (
                                                                <span className="bg-brand-50 text-brand-primary text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter" title={`Invoiced as ${p.convertedToInvoice}`}>
                                                                    LINKED
                                                                </span>
                                                            );
                                                        }
                                                    } catch(e) {}
                                                    return null;
                                                })()}
                                            </div>
                                            <p 
                                                className="text-[10px] text-slate-400 font-bold uppercase hover:text-brand-primary transition-colors"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/clients/${encodeURIComponent(q.clientName)}`);
                                                }}
                                            >
                                                {q.clientName}
                                            </p>
                                            {q.validityDate && q.status?.toLowerCase() !== 'accepted' && (
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">Valid Until:</span>
                                                    <span className="text-[9px] font-bold text-rose-500 whitespace-nowrap">{formatDate(q.validityDate)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-slate-900 text-sm">{q.currency} {q.total}</p>
                                        <span className={`inline-flex items-center gap-1 text-[9px] uppercase font-black px-2 py-0.5 rounded-full mt-1 ${
                                            q.status === 'Accepted' ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'
                                        }`}>
                                            {q.status === 'Accepted' ? <CheckCircle className="w-2.5 h-2.5" /> : <AlertCircle className="w-2.5 h-2.5" />}
                                            {q.status || 'Draft'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                             {invoiceHistory.filter(i => i.documentType === "Quotation").length === 0 && (
                                <div className="px-8 py-16 text-center text-slate-400 font-bold text-sm">
                                    No recent quotations.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
