"use client";

import React from "react";
import Image from "next/image";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Navbar } from "../../components/Navbar";
import { InvoicePreview } from "../../components/InvoicePreview";
import { downloadInvoicePdf } from "../../lib/pdf";
import { InvoiceData } from "../../lib/types";
import toast from "react-hot-toast";
import { 
  Users, 
  Calendar, 
  FileText, 
  Search, 
  Filter, 
  ChevronDown, 
  RefreshCw,
  MoreVertical,
  ArrowLeft,
  X,
  CreditCard,
  Briefcase
} from "lucide-react";

type InvoiceHistoryRow = {
  createdAt: string;
  invoiceNumber: string;
  date: string;
  clientName: string;
  subject: string;
  currency: string;
  subtotal: string;
  vat: string;
  total: string;
  payloadJson: string; // full invoice JSON string saved in sheet
  createdBy?: string;
  status?: string;
};

const STORAGE_KEY = "invoicecraft:editInvoicePayload";

function formatDate(iso: string) {
  if (!iso) return "";
  // createdAt is ISO; show readable
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

export default function HistoryPage() {
  return (
    <React.Suspense fallback={<div className="h-screen flex items-center justify-center">Loading...</div>}>
      <HistoryContent />
    </React.Suspense>
  );
}

function HistoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = router;

  const [rows, setRows] = React.useState<InvoiceHistoryRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [deleteTarget, setDeleteTarget] = React.useState<InvoiceHistoryRow | null>(null);
  const [currentUser, setCurrentUser] = React.useState("");

  // Preview Modal State
  const [previewInvoice, setPreviewInvoice] = React.useState<InvoiceData | null>(null);
  const previewRef = React.useRef<HTMLDivElement>(null);

  // Load from API based on URL params
  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams(searchParams);
    
    // Ensure we send what's in the URL
    // (searchParams is read-only, new URLSearchParams(searchParams) creates a mutable copy if needed, 
    // but fetch needs a string)
    
    const t = toast.loading("Loading history…");
    try {
      const res = await fetch(`/api/invoice-history?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to load history");
      }

      setRows(Array.isArray(data) ? data : []);
      toast.success("Updated", { id: t });
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed to load history");
      setRows([]);
      toast.error(e?.message || "Failed to load history", { id: t });
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  // Initial Load & subsequent param changes
  React.useEffect(() => {
    setCurrentUser(localStorage.getItem("invoicecraft:username") || "");
    load();
  }, [load]);

  // Helper to update URL
  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    replace(`${pathname}?${params.toString()}`);
  };

  // Debounced Search/Input handler
  // We keep local state for inputs if we want smooth typing, 
  // OR we just debounce the `updateFilter` call. 
  // For simplicity and React standard, we can use a controlled input with debounce callback,
  // or a simple onChange that calls a debounced function.
  // Here we'll use a local state for the input value and useEffect to debounce sync to URL.

  const [localSearch, setLocalSearch] = React.useState(searchParams.get('search') || "");
  const [localClient, setLocalClient] = React.useState(searchParams.get('client') || "");

  React.useEffect(() => {
    setLocalSearch(searchParams.get('search') || "");
  }, [searchParams]);

  React.useEffect(() => {
    setLocalClient(searchParams.get('client') || "");
  }, [searchParams]);

  // Debounced Sync for Search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      const current = searchParams.get('search') || "";
      if (localSearch !== current) {
          updateFilter('search', localSearch);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearch]);

  // Debounced Sync for Client
  React.useEffect(() => {
     const timer = setTimeout(() => {
      const current = searchParams.get('client') || "";
      if (localClient !== current) {
          updateFilter('client', localClient);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localClient]);


  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
       // Force update immediately
       if (localSearch !== (searchParams.get('search') || "")) updateFilter('search', localSearch);
       if (localClient !== (searchParams.get('client') || "")) updateFilter('client', localClient);
    }
  };

  const onEdit = (row: InvoiceHistoryRow) => {
    const isOwner = currentUser === row.createdBy;
    const isAdmin = currentUser === "admin";
    
    if (!isAdmin && !isOwner) {
       toast.error("You can only edit your own invoices");
       return;
    }
    router.push(`/invoice/edit/${row.invoiceNumber}`);
  };

  const onPreview = (row: InvoiceHistoryRow) => {
    try {
      if (!row.payloadJson) {
        toast.error("Missing invoice data");
        return;
      }
      const data = JSON.parse(row.payloadJson);
      setPreviewInvoice(data);
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
      console.error(e);
      toast.error("Failed to download", { id: t });
    }
  };

  return (
    <div className="h-screen flex flex-col bg-orange-50 selection:bg-orange-100 selection:text-orange-900 overflow-hidden">
      <Navbar label="v1.0 History" variant="white" />

      <main className="flex-1 flex flex-col min-h-0 relative">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-br from-brand-start to-brand-end -z-0" />

      {/* Fixed Top Content */}
      <div className="relative z-10 flex-none px-4 pt-8 pb-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between text-white">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">Invoice History</h1>
              <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm border border-white/20">
                 {rows.length} Total
              </span>
            </div>
            <p className="mt-2 text-white/80 text-sm max-w-2xl">
              Track, manage, and download your past invoices.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push("/invoice")}
              className="group flex items-center gap-2 h-10 rounded-xl bg-white/10 px-4 text-sm font-medium text-white shadow-sm hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-all"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              Back to Editor
            </button>

            <button
              onClick={load}
              className="flex items-center gap-2 h-10 rounded-xl bg-orange-500 px-6 text-sm font-medium text-white shadow-lg hover:bg-orange-400 transition-all shadow-orange-900/20"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="rounded-2xl bg-white p-4 shadow-xl shadow-slate-200/50 ring-1 ring-slate-100">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
               {/* 1. Global Search */}
               <div className="relative col-span-1 md:col-span-2 lg:col-span-2">
                 <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                   <Search className="h-5 w-5 text-slate-400" />
                 </div>
                 <input
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search invoice #..."
                    className="h-10 w-full rounded-lg border-0 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-brand-primary"
                 />
               </div>

               {/* 2. Client Filter */}
               <div className="relative">
                 <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                   <Briefcase className="h-4 w-4 text-slate-400" />
                 </div>
                 <input
                    value={localClient}
                    onChange={(e) => setLocalClient(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Filter Client..."
                    className="h-10 w-full rounded-lg border-0 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-brand-primary"
                 />
               </div>

               {/* 3. Status Filter */}
               <div className="relative">
                 <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                   <CreditCard className="h-4 w-4 text-slate-400" />
                 </div>
                 <select
                    value={searchParams.get('status') || ""}
                    onChange={(e) => updateFilter('status', e.target.value)}
                    className="h-10 w-full rounded-lg border-0 bg-slate-50 pl-10 pr-8 text-sm text-slate-900 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-brand-primary appearance-none"
                 >
                    <option value="">All Statuses</option>
                    <option value="paid">Paid</option>
                    <option value="unpaid">Unpaid</option>
                    <option value="overdue">Overdue</option>
                 </select>
                 <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                 </div>
               </div>

               {/* 4. Year Filter */}
               <div className="relative">
                 <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                   <Calendar className="h-4 w-4 text-slate-400" />
                 </div>
                 <select
                    value={searchParams.get('year') || ""}
                    onChange={(e) => updateFilter('year', e.target.value)}
                    className="h-10 w-full rounded-lg border-0 bg-slate-50 pl-10 pr-8 text-sm text-slate-900 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-brand-primary appearance-none"
                 >
                    <option value="">All Years</option>
                    {[2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                 </select>
                 <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                 </div>
               </div>

                {/* 5. Month Filter */}
               <div className="relative">
                 <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                   <Calendar className="h-4 w-4 text-slate-400" />
                 </div>
                 <select
                    value={searchParams.get('month') || ""}
                    onChange={(e) => updateFilter('month', e.target.value)}
                    className="h-10 w-full rounded-lg border-0 bg-slate-50 pl-10 pr-8 text-sm text-slate-900 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-brand-primary appearance-none"
                 >
                    <option value="">All Months</option>
                    {Array.from({ length: 12 }, (_, i) => (
                        <option key={i} value={i}>
                            {new Date(0, i).toLocaleString('default', { month: 'long' })}
                        </option>
                    ))}
                 </select>
                 <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                 </div>
               </div>
           </div>
           
           {/* Active Filters Summary */}
           {(searchParams.toString().length > 0) && (
              <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
                 <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Filters:</span>
                 {searchParams.get('search') && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800">
                       Search: {searchParams.get('search')}
                       <button onClick={() => updateFilter('search', '')}><X className="w-3 h-3 hover:text-orange-950" /></button>
                    </span>
                 )}
                 {searchParams.get('client') && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                       Client: {searchParams.get('client')}
                       <button onClick={() => updateFilter('client', '')}><X className="w-3 h-3 hover:text-blue-950" /></button>
                    </span>
                 )}
                 {searchParams.get('status') && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                       Status: {searchParams.get('status')}
                       <button onClick={() => updateFilter('status', '')}><X className="w-3 h-3 hover:text-green-950" /></button>
                    </span>
                 )}
                  {searchParams.get('year') && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
                       Year: {searchParams.get('year')}
                       <button onClick={() => updateFilter('year', '')}><X className="w-3 h-3 hover:text-indigo-950" /></button>
                    </span>
                 )}
                 {searchParams.get('month') && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-pink-100 px-2.5 py-0.5 text-xs font-medium text-pink-800">
                       Month: {new Date(0, parseInt(searchParams.get('month')!)).toLocaleString('default', { month: 'short' })}
                       <button onClick={() => updateFilter('month', '')}><X className="w-3 h-3 hover:text-pink-950" /></button>
                    </span>
                 )}
                 <button 
                   onClick={() => replace(pathname)}
                   className="ml-auto text-xs text-slate-500 hover:text-slate-700 underline"
                 >
                    Clear All
                 </button>
              </div>
           )}
        </div>
      </div>

      {/* Scrollable Table Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-8 sm:px-6 lg:px-8 relative z-10">
        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex h-64 items-center justify-center rounded-3xl bg-white shadow-lg shadow-slate-200/50">
             <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-t-brand-primary" />
                <span className="text-sm font-medium text-slate-500">Loading records...</span>
             </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/50 ring-1 ring-slate-100">
            <div className="overflow-x-auto">
            <table className="min-w-[1200px] w-full border-collapse text-left text-sm">
              <thead className="sticky top-0 z-20">
                <tr className="border-b border-orange-100 bg-orange-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Invoice #</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Currency</th>
                  <th className="px-6 py-4 text-right">Subtotal</th>
                  <th className="px-6 py-4 text-right">VAT</th>
                  <th className="px-6 py-4 text-right">Total</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-orange-100 bg-white">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-6 py-12 text-center text-slate-500">
                       <div className="flex flex-col items-center gap-2">
                          <Filter className="h-10 w-10 text-slate-300" />
                          <p className="text-base font-medium text-slate-900">No invoices found</p>
                          <p className="text-sm text-slate-400">Try adjusting your filters.</p>
                       </div>
                    </td>
                  </tr>
                ) : (
                  rows.map((r, idx) => (
                    <InvoiceRow
                      key={`${r.invoiceNumber}-${idx}`}
                      row={r}
                      currentUser={currentUser}
                      onPreview={onPreview}
                      onEdit={onEdit}
                      setDeleteTarget={setDeleteTarget}
                    />
                  ))
                )}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-slate-900">
              Confirm Deletion
            </h3>
            <p className="mb-6 text-sm text-slate-600">
              Are you sure you want to delete invoice{" "}
              <span className="font-medium text-slate-900">
                {deleteTarget.invoiceNumber}
              </span>
              ? This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const t = toast.loading("Deleting...");
                  try {
                    const res = await fetch("/api/invoice-history", {
                      method: "DELETE",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        invoiceNumber: deleteTarget.invoiceNumber,
                        currentUser: localStorage.getItem("invoicecraft:username") || ""
                      }),
                    });
                    if (!res.ok) throw new Error("Failed to delete");
                    toast.success("Deleted successfully", { id: t });
                    setDeleteTarget(null);
                    load();
                  } catch (e) {
                    toast.error("Error deleting", { id: t });
                  }
                }}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Preview Modal */}
      {previewInvoice && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex flex-none items-center justify-between border-b border-slate-200 px-6 py-4">
               <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Invoice Preview: {previewInvoice.invoiceNumber}
                  </h3>
               </div>
               <div className="flex gap-2">
                 <button
                    onClick={downloadPreview}
                    className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-primary/90"
                 >
                    Download PDF
                 </button>
                 <button
                    onClick={() => setPreviewInvoice(null)}
                    className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                 >
                    Close
                 </button>
               </div>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto bg-slate-100 p-8">
               <div className="mx-auto w-fit shadow-xl">
                 <InvoicePreview value={previewInvoice} forwardRef={previewRef} />
               </div>
            </div>
          </div>
        </div>
      )}
      </main>
    </div>
  );
}

// Sub-component to fix Hooks in loop issue
function InvoiceRow({
  row,
  currentUser,
  onPreview,
  onEdit,
  setDeleteTarget,
}: {
  row: InvoiceHistoryRow;
  currentUser: string;
  onPreview: (r: InvoiceHistoryRow) => void;
  onEdit: (r: InvoiceHistoryRow) => void;
  setDeleteTarget: (r: InvoiceHistoryRow) => void;
}) {
  const isOwner = currentUser === row.createdBy;
  const isAdmin = currentUser === "admin";
  const canEdit = isAdmin || isOwner;
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <tr className="group transition-colors hover:bg-orange-50 relative">
      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
        {formatDate(row.createdAt)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
          <Users className="w-3 h-3 mr-1" />
          {row.createdBy || "Unk"}
        </span>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <button
          onClick={() => onPreview(row)}
          className="flex items-center gap-1 font-semibold text-brand-primary hover:underline"
        >
          <FileText className="w-3 h-3" />
          {row.invoiceNumber}
        </button>
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-slate-600">{row.date}</td>

      <td className="px-6 py-4 font-medium text-slate-900">{row.clientName}</td>

      <td className="px-6 py-4 text-slate-600 max-w-[200px] truncate" title={row.subject}>
        {row.subject}
      </td>

      {/* Status Column */}
      <td className="px-6 py-4 whitespace-nowrap">
        {row.status === "Paid" ? (
          <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
            Paid
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
            Unpaid
          </span>
        )}
      </td>

      <td className="px-6 py-4 text-slate-500">{row.currency}</td>

      <td className="px-6 py-4 text-right tabular-nums text-slate-600">
        {row.subtotal}
      </td>

      <td className="px-6 py-4 text-right tabular-nums text-slate-600">
        {row.vat}
      </td>

      <td className="px-6 py-4 text-right tabular-nums font-bold text-slate-900">
        {row.total}
      </td>

      {/* Actions Dropdown */}
      <td className="px-6 py-4 text-right relative">
        <div className="relative inline-block text-left" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center justify-center h-8 w-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <span className="sr-only">Open options</span>
            <MoreVertical className="h-4 w-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 z-[100] mt-2 w-32 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onPreview(row);
                  }}
                  className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-600"
                >
                 Preview
                </button>
                {canEdit && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(row);
                    }}
                    className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-600"
                  >
                    Edit Invoice
                  </button>
                )}
                {isAdmin && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setDeleteTarget(row);
                    }}
                    className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
