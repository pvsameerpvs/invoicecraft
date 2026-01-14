"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { useMemo, useState, useEffect } from "react";
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from "recharts";
import { PlusCircle, FileText, TrendingUp, AlertCircle, CheckCircle, Percent, TrendingDown, RotateCcw, Filter, Calendar } from "lucide-react";

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

export const DashboardContainer = ({ onCreateInvoice, invoiceHistory = [] }: DashboardProps) => {
    
    // --- Server Side Stats State ---
    const router = useRouter();
    const searchParams = useSearchParams();

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
        overdue: { count: 0, value: 0 }, // New Overdue Metrics
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

    // Calculate Paid Count (Client Side Approximation if not provided by API, assuming Total - Unpaid)
    // Note: This relies on stats.invoices.value being Total and stats.outstanding.count being Unpaid
    const paidCount = Math.max(0, stats.invoices.value - stats.outstanding.count);

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
                                            className="w-full sm:w-auto pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-100 border border-transparent hover:border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all appearance-none cursor-pointer"
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
                                                className="w-full sm:w-auto pl-4 pr-8 py-2 bg-slate-50 hover:bg-slate-100 border border-transparent hover:border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all appearance-none cursor-pointer min-w-[140px]"
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
                                className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-colors"
                                title="Reset Filters"
                             >
                                <RotateCcw className="w-4 h-4" />
                             </button>
                        </div>

                        <button 
                            onClick={onCreateInvoice}
                            className="flex items-center justify-center gap-2 bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-orange-600/20 hover:bg-orange-700 active:scale-95 transition-all"
                        >
                            <PlusCircle className="w-5 h-5" />
                            <span className="inline">Create Invoice</span>
                        </button>
                    </div>
                </div>

                {/* Stats Slider */}
                <div className="flex overflow-x-auto pb-4 gap-6 no-scrollbar snap-x">
                    {/* Total Revenue */}
                    <div className="min-w-[320px] flex-shrink-0 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between snap-center">
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">Total Revenue</p>
                            <h3 className="text-3xl font-extrabold text-slate-900">
                                {stats.loading ? "..." : fmtMoney(stats.revenue.value)}
                            </h3>
                            {!stats.loading && <GrowthBadge value={stats.revenue.growth} />}
                        </div>
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                    </div>

                    {/* Total Paid Invoices */}
                    <div className="min-w-[320px] flex-shrink-0 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between snap-center">
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">Total Paid Invoices</p>
                            <h3 className="text-3xl font-extrabold text-slate-900">
                                {stats.loading ? "..." : paidCount}
                            </h3>
                             <p className="text-xs font-bold text-green-600 mt-1">
                                {stats.loading ? "..." : fmtMoney(stats.revenue.value)}
                            </p>
                             {!stats.loading && <GrowthBadge value={stats.invoices.growth} />}
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
                                {stats.loading ? "..." : fmtMoney(stats.vat.value)}
                            </h3>
                             {!stats.loading && <GrowthBadge value={stats.vat.growth} />}
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
                                {stats.loading ? "..." : fmtMoney(stats.outstanding.value)}
                            </h3>
                             <p className="text-xs font-bold text-slate-500 mt-1">
                                {stats.loading ? "..." : `${stats.outstanding.count} Invoices`}
                            </p>
                            {!stats.loading && <GrowthBadge value={stats.outstanding.growth} />}
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
                                {stats.loading ? "..." : fmtMoney(stats.overdue.value)}
                            </h3>
                            <p className="text-xs font-bold text-red-500 mt-1">
                                {stats.loading ? "..." : `${stats.overdue.count} Overdue`}
                            </p>
                        </div>
                        <div className="p-3 bg-red-100 text-red-700 rounded-xl">
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
                                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => `AED ${val}`} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: 'none', color: '#f8fafc' }}
                                        itemStyle={{ color: '#f8fafc' }}
                                    />
                                    <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
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

                {/* Recent Activity Mini-Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
                        <h3 className="font-bold text-slate-900">Recent Invoices</h3>
                        <button 
                            onClick={() => router.push('/history')}
                            className="text-sm font-bold text-orange-600 hover:text-orange-700"
                        >
                            View All
                        </button>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {invoiceHistory.slice(0, 3).map((invoice, i) => (
                            <div key={i} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div>
                                        <p className="font-bold text-slate-900 text-sm">Invoice {invoice.invoiceNumber}</p>
                                        <p className="text-xs text-slate-500">Generated on {invoice.date}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                     <p className="font-bold text-slate-900 text-sm">{invoice.currency} {invoice.total}</p>
                                     <span className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full mt-1 ${
                                         invoice.status === 'Paid' ? 'text-green-600 bg-green-50' : 'text-orange-600 bg-orange-50'
                                     }`}>
                                        {invoice.status === 'Paid' ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                        {invoice.status || 'Unpaid'}
                                     </span>
                                </div>
                            </div>
                        ))}
                        {invoiceHistory.length === 0 && (
                             <div className="px-6 py-8 text-center text-slate-500 text-sm">
                                 No recent invoices found.
                             </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
