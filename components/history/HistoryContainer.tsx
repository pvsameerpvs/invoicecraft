"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import toast from "react-hot-toast";
import { 
  PlusCircle, 
  RefreshCw, 
  Search, 
  Filter, 
  ChevronDown, 
  X, 
  Calendar,
  Briefcase,
  ArrowLeft,
  FileText
} from "lucide-react";

import { HistoryRow } from "./HistoryRow";
import { InvoicePreview } from "../InvoicePreview";
import { downloadInvoicePdf } from "@/lib/pdf";
import { InvoiceData, InvoiceHistoryRow } from "@/lib/types";
import { Skeleton } from "../ui/skeleton";
import { BUSINESS_PROFILES } from "@/lib/businessProfiles";

interface HistoryContainerProps {
  documentType: "Invoice" | "Quotation";
}

export const HistoryContainer = ({ documentType }: HistoryContainerProps) => {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading...</div>}>
      <HistoryContent documentType={documentType} />
    </Suspense>
  );
};

const HistoryContent = ({ documentType }: HistoryContainerProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = router;

  const [rows, setRows] = useState<InvoiceHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<InvoiceHistoryRow | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState<InvoiceData | null>(null);
  const previewRef = React.useRef<HTMLDivElement>(null);

  const [currentUser, setCurrentUser] = useState("");
  const [currentRole, setCurrentRole] = useState("");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const [localSearch, setLocalSearch] = useState(searchParams.get("search") || "");
  const [localClient, setLocalClient] = useState(searchParams.get("client") || "");

  const isQuotation = documentType === "Quotation";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams(searchParams);
    params.set("type", documentType);

    const t = toast.loading(`Loading ${documentType.toLowerCase()}s...`);
    try {
      const res = await fetch(`/api/invoice-history?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load history");
      setRows(Array.isArray(data) ? data : []);
      toast.success("Updated", { id: t });
    } catch (e: any) {
      setError(e?.message || "Failed to load history");
      toast.error(e?.message || "Failed to load history", { id: t });
    } finally {
      setLoading(false);
    }
  }, [searchParams, documentType]);

  useEffect(() => {
    setCurrentUser(localStorage.getItem("invoicecraft:username") || "");
    setCurrentRole(localStorage.getItem("invoicecraft:role") || "");
    load();
  }, [load]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    replace(`${pathname}?${params.toString()}`);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== (searchParams.get("search") || "")) updateFilter("search", localSearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localClient !== (searchParams.get("client") || "")) updateFilter("client", localClient);
    }, 500);
    return () => clearTimeout(timer);
  }, [localClient]);

  const onEdit = (row: InvoiceHistoryRow) => {
    router.push(`/invoice/edit/${row.invoiceNumber}?type=${documentType}`);
  };

  const onPreview = (row: InvoiceHistoryRow) => {
    try {
      if (!row.payloadJson) return toast.error("Missing data");
      setPreviewInvoice(JSON.parse(row.payloadJson));
    } catch (e) {
      toast.error("Failed to load preview");
    }
  };

  const downloadPreview = async () => {
    if (!previewRef.current) return;
    const t = toast.loading("Generating PDF...");
    try {
      await downloadInvoicePdf(previewRef.current);
      toast.success("Downloaded", { id: t });
    } catch (e) {
      toast.error("Failed to download", { id: t });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-brand-100/50">
      {/* Header Section */}
      <div className="relative bg-gradient-to-br from-brand-start to-brand-end px-4 pt-10 pb-20 sm:px-8">
         <div className="absolute inset-0 bg-black/5 mix-blend-overlay" />
         <div className="relative max-w-7xl mx-auto flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
               <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-black text-white tracking-tight">
                    {isQuotation ? "Quotation History" : "Invoice History"}
                  </h1>
                  <span className="bg-white/20 backdrop-blur-md text-white text-sm font-bold px-3 py-1 rounded-full border border-white/10 shadow-sm">
                    {rows.length} Total
                  </span>
               </div>
               <p className="text-white/70 font-medium max-w-xl">
                 Manage, search, and track all your {documentType.toLowerCase()} documents in one place.
               </p>
            </div>

            <div className="flex flex-wrap gap-3">
               <button
                 onClick={() => router.push("/dashboard")}
                 className="flex items-center gap-2 h-11 px-6 rounded-xl bg-white/10 text-white font-bold backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all active:scale-95"
               >
                 <ArrowLeft className="w-4 h-4" />
                 Back
               </button>
               <button
                 onClick={() => router.push(isQuotation ? "/invoice?type=Quotation" : "/invoice")}
                 className="flex items-center gap-2 h-11 px-6 rounded-xl bg-white text-slate-900 font-bold shadow-xl hover:shadow-white/10 transition-all active:scale-95"
               >
                 <PlusCircle className="w-5 h-5 text-brand-primary" />
                 Create New
               </button>
            </div>
         </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 -mt-10 px-4 pb-20 sm:px-8 relative z-10">
         <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Filter Bar Card */}
            <div className="bg-white rounded-[2rem] p-6 shadow-2xl shadow-slate-200/50 border border-slate-100 ring-1 ring-black/5">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <input 
                      value={localSearch}
                      onChange={e => setLocalSearch(e.target.value)}
                      placeholder={`Search ${isQuotation ? "Quotation" : "Invoice"} #...`}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-brand-primary/10 transition-all"
                    />
                  </div>
                  {/* Client Input */}
                  <div className="relative">
                    <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <input 
                      value={localClient}
                      onChange={e => setLocalClient(e.target.value)}
                      placeholder="Filter by Client Company..."
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-brand-primary/10 transition-all"
                    />
                  </div>
                  {/* Status Select */}
                  <div className="relative">
                    <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <select 
                      value={searchParams.get("status") || ""}
                      onChange={e => updateFilter("status", e.target.value)}
                      className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-brand-primary/10 transition-all appearance-none cursor-pointer"
                    >
                      <option value="">All Statuses</option>
                      {isQuotation ? (
                        <>
                          <option value="draft">Draft</option>
                          <option value="sent">Sent</option>
                          <option value="accepted">Accepted</option>
                        </>
                      ) : (
                        <>
                          <option value="paid">Paid</option>
                          <option value="unpaid">Unpaid</option>
                          <option value="overdue">Overdue</option>
                        </>
                      )}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                  {/* Business Profile Select */}
                  <div className="relative">
                    <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <select 
                      value={searchParams.get("profile") || ""}
                      onChange={e => updateFilter("profile", e.target.value)}
                      className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-brand-primary/10 transition-all appearance-none cursor-pointer"
                    >
                      <option value="">All Profiles</option>
                      {Object.values(BUSINESS_PROFILES).map(p => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                  {/* Actions */}
                  <div className="flex gap-2">
                     <button
                        onClick={load}
                        className="flex-1 flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-2xl font-bold text-slate-600 transition-all active:scale-95"
                     >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                     </button>
                      {(localSearch || localClient || searchParams.toString()) && (
                        <button
                          onClick={() => replace(pathname)}
                          className="w-12 flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-2xl transition-all active:scale-95"
                          title="Clear Filters"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                  </div>
                </div>
            </div>

            {/* Table Card */}
            <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 ring-1 ring-black/5 overflow-hidden">
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="w-16 px-6 py-5"></th>
                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Creation</th>
                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">User</th>
                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">{isQuotation ? "Quotation" : "Invoice"} No.</th>
                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Doc Date</th>
                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Client / Company</th>
                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Subject</th>
                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Cur</th>
                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Subtotal</th>
                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Tax</th>
                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right bg-slate-50/10 font-black">Final Amount</th>
                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loading ? (
                        [...Array(6)].map((_, i) => (
                          <tr key={i}>
                            <td colSpan={13} className="px-6 py-4"><Skeleton className="h-8 w-full rounded-xl" /></td>
                          </tr>
                        ))
                      ) : rows.length === 0 ? (
                        <tr>
                          <td colSpan={13} className="px-6 py-20 text-center">
                            <div className="flex flex-col items-center gap-4">
                                <div className="p-6 bg-slate-50 rounded-full">
                                   <FileText className="w-12 h-12 text-slate-200" />
                                </div>
                                <div className="space-y-1">
                                   <p className="text-xl font-black text-slate-900">No projects found</p>
                                   <p className="text-slate-500 font-medium">Try adjusting your search or filters.</p>
                                </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        rows.map((row, idx) => (
                          <HistoryRow 
                            key={`${row.invoiceNumber}-${idx}`}
                            row={row}
                            currentUser={currentUser}
                            currentRole={currentRole}
                            onPreview={onPreview}
                            onEdit={onEdit}
                            onDelete={setDeleteTarget}
                          />
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
            </div>
         </div>
      </main>

      {/* Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-3xl text-center space-y-6">
            <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-3xl mx-auto flex items-center justify-center">
               <AlertCircle className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900">Serious Request!</h3>
              <p className="text-slate-500 font-medium leading-relaxed">
                You are about to permanently delete <strong>{deleteTarget.invoiceNumber}</strong> for <strong>{deleteTarget.clientName}</strong>. This is irreversible.
              </p>
            </div>
            <div className="flex gap-4 pt-4">
              <button 
                onClick={() => setDeleteTarget(null)}
                className="flex-1 h-14 rounded-2xl bg-slate-100 text-slate-900 font-black hover:bg-slate-200 transition-all"
              >
                Go Back
              </button>
              <button 
                onClick={async () => {
                   const t = toast.loading("Purging data...");
                   try {
                     const res = await fetch("/api/invoice-history", {
                        method: "DELETE",
                        body: JSON.stringify({
                          invoiceNumber: deleteTarget.invoiceNumber,
                          currentUser,
                          documentType: deleteTarget.documentType
                        })
                     });
                     if(!res.ok) throw new Error("Delete failed");
                     toast.success("Successfully Deleted", { id: t });
                     setDeleteTarget(null);
                     load();
                   } catch (e) {
                     toast.error("Cleanup Failed", { id: t });
                   }
                }}
                className="flex-1 h-14 rounded-2xl bg-rose-600 text-white font-black shadow-xl shadow-rose-200 hover:bg-rose-700 transition-all"
              >
                Yes, Purge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewInvoice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-xl p-4 sm:p-10 animate-in fade-in zoom-in-95 duration-200">
           <div className="w-full max-w-6xl h-full bg-white shadow-3xl rounded-[2.5rem] flex flex-col overflow-hidden">
               <div className="flex px-10 py-6 items-center justify-between border-b border-slate-100 flex-none">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-brand-50 rounded-2xl text-brand-primary">
                        <FileText className="w-6 h-6" />
                     </div>
                     <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">{previewInvoice.documentType} Preview</h2>
                        <p className="text-slate-400 font-bold text-xs">DOC: {previewInvoice.invoiceNumber}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <button
                        onClick={downloadPreview}
                        className="h-11 px-8 rounded-xl bg-brand-primary text-white font-black shadow-lg shadow-brand-primary/20 hover:bg-brand-end transition-all active:scale-95"
                     >
                        Download PDF
                     </button>
                     <button
                        onClick={() => setPreviewInvoice(null)}
                        className="w-11 h-11 flex items-center justify-center bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-200 hover:text-slate-900 transition-all"
                     >
                        <X className="w-6 h-6" />
                     </button>
                  </div>
               </div>
               <div className="flex-1 overflow-y-auto bg-slate-50/50 p-10 scrollbar-hide">
                  <div className="mx-auto w-fit">
                    <InvoicePreview value={previewInvoice} forwardRef={previewRef} />
                  </div>
               </div>
           </div>
        </div>
      )}
    </div>
  );
};

const AlertCircle = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
);
