"use client";

import React, { useMemo } from "react";
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from "recharts";
import { PlusCircle, FileText, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";

interface DashboardProps {
    onCreateInvoice: () => void;
    // We'll pass the fetched history data here in the future
    invoiceHistory?: any[]; 
}

const COLORS = ["#f97316", "#ef4444", "#22c55e"]; // Orange, Red, Green

export const DashboardContainer = ({ onCreateInvoice, invoiceHistory = [] }: DashboardProps) => {

    // 1. Calculate Stats
    const stats = useMemo(() => {
        // Mock data logic for now, or real calculation if `invoiceHistory` is populated
        const total = invoiceHistory.length;
        // In a real app, you'd parse `payloadJson` to get the actual total amount.
        // For this UI demo, we'll simulate some stats or calculate basic counts.
        
        return {
            totalInvoices: total || 124,
            totalRevenue: "AED 45,200", 
            outstanding: "AED 12,500",
            paid: "AED 32,700"
        };
    }, [invoiceHistory]);

    // 2. Mock Chart Data for "Software-like" feel
    const areaData = [
        { name: "Jan", revenue: 4000 },
        { name: "Feb", revenue: 3000 },
        { name: "Mar", revenue: 2000 },
        { name: "Apr", revenue: 2780 },
        { name: "May", revenue: 1890 },
        { name: "Jun", revenue: 2390 },
        { name: "Jul", revenue: 3490 },
    ];

    const pieData = [
        { name: "Pending", value: 400 },
        { name: "Overdue", value: 300 },
        { name: "Paid", value: 300 },
    ];

    return (
        <div className="flex-1 bg-slate-50 p-4 md:p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
                        <p className="text-slate-500">Welcome back, here is your financial overview.</p>
                    </div>
                    <button 
                        onClick={onCreateInvoice}
                        className="flex items-center gap-2 bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-orange-600/20 hover:bg-orange-700 active:scale-95 transition-all"
                    >
                        <PlusCircle className="w-5 h-5" />
                        Create Invoice
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">Total Revenue</p>
                            <h3 className="text-3xl font-extrabold text-slate-900">{stats.totalRevenue}</h3>
                            <div className="flex items-center gap-1 text-green-600 text-xs font-bold mt-2 bg-green-50 px-2 py-1 rounded-lg w-fit">
                                <TrendingUp className="w-3 h-3" />
                                +12.5% vs last month
                            </div>
                        </div>
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">Total Invoices</p>
                            <h3 className="text-3xl font-extrabold text-slate-900">{stats.totalInvoices}</h3>
                            <p className="text-xs text-slate-400 mt-2 font-medium">All time generated</p>
                        </div>
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <FileText className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">Outstanding</p>
                            <h3 className="text-3xl font-extrabold text-slate-900">{stats.outstanding}</h3>
                             <div className="flex items-center gap-1 text-red-600 text-xs font-bold mt-2 bg-red-50 px-2 py-1 rounded-lg w-fit">
                                <AlertCircle className="w-3 h-3" />
                                3 Invoices Overdue
                            </div>
                        </div>
                        <div className="p-3 bg-red-50 text-red-600 rounded-xl">
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
                                <AreaChart data={areaData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                    
                    {/* Status Chart */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                        <h3 className="text-lg font-bold text-slate-900 mb-6">Invoice Status</h3>
                        <div className="items-center justify-center flex-1 min-h-[200px] relative">
                             <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36}/>
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Center Text */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                                <div className="text-center">
                                    <span className="block text-2xl font-bold text-slate-900">100%</span>
                                    <span className="text-xs text-slate-500">Completion</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activity Mini-Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
                        <h3 className="font-bold text-slate-900">Recent Invoices</h3>
                        <button className="text-sm font-bold text-orange-600 hover:text-orange-700">View All</button>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                                        #{28 + i}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 text-sm">Invoice INV-2026-00{28+i}</p>
                                        <p className="text-xs text-slate-500">Generated on 13 Jan 2026</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                     <p className="font-bold text-slate-900 text-sm">AED 1,20{i}.00</p>
                                     <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full mt-1">
                                        <CheckCircle className="w-3 h-3" /> Paid
                                     </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};
