"use client";

import React from "react";
import { useRouter } from "next/navigation";

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

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/invoice-history", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Failed to load history");
        setRows([]);
        return;
      }

      // API returns array
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load history");
      setRows([]);
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
      localStorage.setItem(STORAGE_KEY, row.payloadJson || "");
    } catch {}
    router.push("/invoice");
  };

  return (
    <main className="min-h-screen bg-slate-100 p-4 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Invoice History</h1>
            <p className="text-sm text-slate-500">
              Saved invoices from Google Sheet (search by invoice number).
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => router.push("/invoice")}
              className="h-10 rounded-xl bg-white px-4 text-sm font-medium text-slate-900 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
            >
              Back to Invoice
            </button>

            <button
              onClick={load}
              className="h-10 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <label className="text-xs font-medium text-slate-700">
            Search (invoiceNumber)
          </label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="e.g. INV-2025-001"
            className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>

        {/* Errors / Loading */}
        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl bg-white p-6 text-sm text-slate-600 shadow-sm ring-1 ring-slate-200">
            Loading…
          </div>
        ) : (
          <div className="overflow-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <table className="min-w-[1100px] w-full border-collapse text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold text-slate-700">
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Invoice #</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Currency</th>
                  <th className="px-4 py-3 text-right">Subtotal</th>
                  <th className="px-4 py-3 text-right">VAT</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-6 text-center text-slate-500">
                      No invoices found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((r, idx) => (
                    <tr
                      key={`${r.invoiceNumber}-${idx}`}
                      className="border-t border-slate-100"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600">
                        {formatDate(r.createdAt)}
                      </td>

                      <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                        {r.invoiceNumber}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">{r.date}</td>

                      <td className="px-4 py-3">{r.clientName}</td>

                      <td className="px-4 py-3">{r.subject}</td>

                      <td className="px-4 py-3">{r.currency}</td>

                      <td className="px-4 py-3 text-right tabular-nums">
                        {r.subtotal}
                      </td>

                      <td className="px-4 py-3 text-right tabular-nums">
                        {r.vat}
                      </td>

                      <td className="px-4 py-3 text-right tabular-nums font-semibold">
                        {r.total}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => onEdit(r)}
                          className="h-9 rounded-xl bg-slate-900 px-3 text-xs font-medium text-white hover:bg-slate-800"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
