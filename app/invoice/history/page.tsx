"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function InvoiceHistoryPage() {
  const router = useRouter();
  const [rows, setRows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/invoice-history");
    const data = await res.json();
    setRows(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  React.useEffect(() => {
    load();
  }, []);

  const onLoadInvoice = (payloadJson: string) => {
    try {
      const invoice = JSON.parse(payloadJson);
      localStorage.setItem("invoiceDraft", JSON.stringify(invoice));
      router.push("/invoice");
    } catch {}
  };

  return (
    <main className="min-h-screen bg-slate-100 p-4 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Invoice History</h1>
          <button
            className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white"
            onClick={() => router.push("/invoice")}
          >
            Back
          </button>
        </div>

        <div className="rounded-xl bg-white p-4 shadow">
          {loading ? (
            <div className="text-sm text-slate-500">Loading...</div>
          ) : rows.length === 0 ? (
            <div className="text-sm text-slate-500">No invoices yet.</div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left">Invoice #</th>
                    <th className="py-2 text-left">Date</th>
                    <th className="py-2 text-left">Client</th>
                    <th className="py-2 text-right">Total</th>
                    <th className="py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.invoiceNumber} className="border-b">
                      <td className="py-2">{r.invoiceNumber}</td>
                      <td className="py-2">{r.date}</td>
                      <td className="py-2">{r.clientName}</td>
                      <td className="py-2 text-right">
                        {r.currency} {r.total}
                      </td>
                      <td className="py-2 text-right">
                        <button
                          className="rounded-md border px-3 py-1 text-xs"
                          onClick={() => onLoadInvoice(r.payloadJson)}
                        >
                          Load
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
