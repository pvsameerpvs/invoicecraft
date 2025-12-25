"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { UserMenu } from "../../components/UserMenu";
import toast from "react-hot-toast";

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
  const router = useRouter();

  const [rows, setRows] = React.useState<InvoiceHistoryRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [deleteTarget, setDeleteTarget] = React.useState<InvoiceHistoryRow | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    const t = toast.loading("Loading history…");
    try {
      const res = await fetch("/api/invoice-history", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to load history");
      }

      // API returns array
      setRows(Array.isArray(data) ? data : []);
      toast.success("History loaded", { id: t });
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed to load history");
      setRows([]);
      toast.error(e?.message || "Failed to load history", { id: t });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => (r.invoiceNumber || "").toLowerCase().includes(q));
  }, [rows, search]);

  const onEdit = (row: InvoiceHistoryRow) => {
    // Store full payload in localStorage and go to /invoice
    try {
      if (!row.payloadJson) {
        toast.error("Cannot edit: missing invoice data");
        return;
      }
      localStorage.setItem(STORAGE_KEY, row.payloadJson || "");
      toast.success("Loading invoice details…");
      router.push("/invoice");
    } catch (e) {
      toast.error("Failed to prepare invoice for editing");
    }
  };

  return (
    <main className="min-h-screen bg-orange-50 relative selection:bg-orange-100 selection:text-orange-900">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-br from-brand-start to-brand-end -z-0" />
      
      <div className="fixed top-6 left-6 z-50">
        <UserMenu />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl pt-20 px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between text-white">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Invoice History</h1>
            <p className="mt-2 text-white/80 text-sm max-w-2xl">
              Track, manage, and download your past invoices. Data is synced with your Google Sheet.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push("/invoice")}
              className="h-10 rounded-xl bg-white/10 px-4 text-sm font-medium text-white shadow-sm hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-all"
            >
              Back to Editor
            </button>

            <button
              onClick={load}
              className="h-10 rounded-xl bg-orange-500 px-6 text-sm font-medium text-white shadow-lg hover:bg-orange-400 transition-all shadow-orange-900/20"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6 rounded-2xl bg-white p-2 shadow-xl shadow-slate-200/50 ring-1 ring-slate-100">
           <div className="relative">
             <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
               <svg className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                 <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
               </svg>
             </div>
             <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by invoice number..."
                className="h-12 w-full rounded-xl bg-transparent pl-11 pr-4 text-sm text-slate-700 outline-none placeholder:text-slate-400"
             />
           </div>
        </div>

        {/* Errors / Loading */}
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
              <thead>
                <tr className="border-b border-orange-100 bg-orange-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Invoice #</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Currency</th>
                  <th className="px-6 py-4 text-right">Subtotal</th>
                  <th className="px-6 py-4 text-right">VAT</th>
                  <th className="px-6 py-4 text-right">Total</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-orange-100 bg-white">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-6 py-12 text-center text-slate-500">
                       <div className="flex flex-col items-center gap-2">
                          <p className="text-base font-medium text-slate-900">No invoices found</p>
                          <p className="text-sm text-slate-400">Try adjusting your search query.</p>
                       </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((r, idx) => (
                    <tr
                      key={`${r.invoiceNumber}-${idx}`}
                      className="group transition-colors hover:bg-orange-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                        {formatDate(r.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                         <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
                           {r.createdBy || "Unk"}
                         </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-900">{r.invoiceNumber}</span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">{r.date}</td>

                      <td className="px-6 py-4 font-medium text-slate-900">{r.clientName}</td>

                      <td className="px-6 py-4 text-slate-600 max-w-[200px] truncate" title={r.subject}>{r.subject}</td>

                      <td className="px-6 py-4 text-slate-500">{r.currency}</td>

                      <td className="px-6 py-4 text-right tabular-nums text-slate-600">
                        {r.subtotal}
                      </td>

                      <td className="px-6 py-4 text-right tabular-nums text-slate-600">
                        {r.vat}
                      </td>

                      <td className="px-6 py-4 text-right tabular-nums font-bold text-slate-900">
                        {r.total}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onEdit(r)}
                          className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-brand-primary shadow-sm ring-1 ring-inset ring-orange-200 hover:bg-orange-50"
                        >
                          Edit
                        </button>
                        {localStorage.getItem("invoicecraft:username") === "admin" && (
                          <button
                            onClick={() => setDeleteTarget(r)}
                            className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-red-100 hover:bg-red-100"
                          >
                            Delete
                          </button>
                        )}
                        </div>
                      </td>
                    </tr>
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
                className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
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
    </main>
  );
}
