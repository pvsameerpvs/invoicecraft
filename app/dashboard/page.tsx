"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardContainer } from "../../components/DashboardContainer";
import { Navbar } from "../../components/Navbar";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const router = useRouter();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch("/api/invoice-history");
        if (res.ok) {
          const data = await res.json();
          setHistory(data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return (
    <div className="flex h-screen flex-col bg-slate-50">
         <Navbar label="Dashboard" variant="white" />
         {loading ? (
             <div className="flex-1 flex items-center justify-center">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
             </div>
         ) : (
             <React.Suspense fallback={<div>Loading stats...</div>}>
                 <DashboardContainer 
                    onCreateInvoice={() => router.push("/invoice")} 
                    invoiceHistory={history}
                 />
             </React.Suspense>
         )}
    </div>
  );
}
