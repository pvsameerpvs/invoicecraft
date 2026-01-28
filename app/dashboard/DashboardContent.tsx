"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardContainer } from "@/components/DashboardContainer";
import { Skeleton } from "@/components/ui/skeleton";
import toast from "react-hot-toast";

export default function DashboardContent() {
  const router = useRouter();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const [invRes, qtnRes] = await Promise.all([
          fetch("/api/invoice-history?type=Invoice"),
          fetch("/api/invoice-history?type=Quotation")
        ]);

        let combined: any[] = [];
        if (invRes.ok) combined = [...combined, ...(await invRes.json())];
        if (qtnRes.ok) combined = [...combined, ...(await qtnRes.json())];

        // Sort by createdAt desc
        combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setHistory(combined);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return (
        <div className="flex-1 bg-slate-50 p-4 md:p-8 overflow-hidden h-full">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Skeleton */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <div className="flex gap-3">
                        <Skeleton className="h-10 w-64 rounded-xl" />
                        <Skeleton className="h-10 w-32 rounded-xl" />
                    </div>
                </div>

                {/* Stats Cards Skeleton */}
                <div className="flex gap-6 overflow-hidden">
                    {[1,2,3,4,5].map(i => (
                        <div key={i} className="min-w-[320px] bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between">
                            <div className="space-y-3">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-8 w-32" />
                                <Skeleton className="h-5 w-20 rounded-lg" />
                            </div>
                            <Skeleton className="h-12 w-12 rounded-xl" />
                        </div>
                    ))}
                </div>

                {/* Charts Loading */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <Skeleton className="h-6 w-48 mb-6" />
                        <Skeleton className="h-[300px] w-full rounded-xl" />
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <Skeleton className="h-6 w-32 mb-6" />
                        <Skeleton className="h-[300px] w-full rounded-full" />
                    </div>
                </div>
            </div>
        </div>
    );
  }

  return (
    <DashboardContainer 
        onCreateInvoice={() => router.push("/invoice")} 
        invoiceHistory={history}
    />
  );
}
