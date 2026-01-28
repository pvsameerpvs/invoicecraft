"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Users, 
  Search, 
  ArrowRight, 
  Building2, 
  TrendingUp, 
  FileText,
  Mail,
  Phone
} from "lucide-react";
import toast from "react-hot-toast";
import { Skeleton } from "../../components/ui/skeleton";

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchAllClients = async () => {
      try {
        const [invRes, qtnRes] = await Promise.all([
          fetch("/api/invoice-history?type=Invoice"),
          fetch("/api/invoice-history?type=Quotation")
        ]);

        let combined: any[] = [];
        if (invRes.ok) combined = [...combined, ...(await invRes.json())];
        if (qtnRes.ok) combined = [...combined, ...(await qtnRes.json())];

        // Group by clientName
        const clientMap: Record<string, any> = {};
        combined.forEach(doc => {
          const name = doc.clientName || "Unknown Client";
          if (!clientMap[name]) {
            clientMap[name] = {
              name,
              invoiceCount: 0,
              quotationCount: 0,
              totalRevenue: 0,
              lastInteraction: doc.createdAt,
              lastDocType: doc.documentType
            };
          }
          
          if (doc.documentType === "Invoice") {
            clientMap[name].invoiceCount++;
            clientMap[name].totalRevenue += parseFloat(doc.total.replace(/,/g, "")) || 0;
          } else {
            clientMap[name].quotationCount++;
          }

          if (new Date(doc.createdAt) > new Date(clientMap[name].lastInteraction)) {
            clientMap[name].lastInteraction = doc.createdAt;
            clientMap[name].lastDocType = doc.documentType;
          }
        });

        setClients(Object.values(clientMap).sort((a, b) => b.totalRevenue - a.totalRevenue));
      } catch (error) {
        console.error("Failed to fetch clients", error);
        toast.error("Failed to load client directory");
      } finally {
        setLoading(false);
      }
    };

    fetchAllClients();
  }, []);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-start to-brand-end px-4 pt-10 pb-20 sm:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/5 mix-blend-overlay" />
        <div className="relative max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
                <Users className="w-10 h-10" />
                Client Directory
              </h1>
              <p className="text-white/70 font-medium max-w-xl">
                Browse and manage all your client relationships and transaction histories.
              </p>
            </div>

            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search clients by name..."
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-white/50 focus:outline-none focus:ring-4 focus:ring-white/10 backdrop-blur-md transition-all font-bold"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 -mt-10 sm:px-8 pb-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
             [...Array(6)].map((_, i) => (
               <div key={i} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 ring-1 ring-black/5 space-y-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-12 h-12 rounded-2xl" />
                    <div className="space-y-2">
                       <Skeleton className="h-4 w-32" />
                       <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-full rounded-xl" />
               </div>
             ))
          ) : filteredClients.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
               <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
               <h3 className="text-xl font-black text-slate-900">No Clients Found</h3>
               <p className="text-slate-500 font-medium">Try a different search term or start creating documents.</p>
            </div>
          ) : (
            filteredClients.map((client, i) => (
              <div 
                key={i} 
                onClick={() => router.push(`/clients/${encodeURIComponent(client.name)}`)}
                className="group bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 ring-1 ring-black/5 hover:ring-brand-primary/30 transition-all cursor-pointer hover:-translate-y-1 active:scale-[0.98]"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-brand-50 group-hover:text-brand-primary transition-colors">
                      <Building2 className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 leading-tight group-hover:text-brand-primary transition-colors">{client.name}</h3>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Active Client</p>
                    </div>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl text-slate-400 group-hover:bg-brand-50 group-hover:text-brand-primary transition-all">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Billing</p>
                    <p className="text-sm font-black text-slate-900 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-emerald-500" />
                      {client.invoiceCount} Invoices
                    </p>
                  </div>
                  <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Revenue</p>
                    <p className="text-sm font-black text-slate-900">
                      <span className="text-[10px] text-brand-primary mr-1">AED</span>
                      {client.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 bg-slate-50 px-4 py-2 rounded-xl">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3 h-3" />
                    {client.quotationCount} Proposals
                  </span>
                  <span>Last: {new Date(client.lastInteraction).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
