"use client";

import React from "react";
import { ChevronDown, MoreVertical, FileText, Users, Briefcase, CheckCircle, AlertCircle, FilePlus2, FileCheck } from "lucide-react";
import { InvoiceHistoryRow } from "@/lib/types";

interface HistoryRowProps {
  row: InvoiceHistoryRow;
  currentUser: string;
  currentRole: string;
  onPreview: (row: InvoiceHistoryRow) => void;
  onEdit: (row: InvoiceHistoryRow) => void;
  onDelete: (row: InvoiceHistoryRow) => void;
  hideClient?: boolean;
}

export const HistoryRow = ({
  row,
  currentUser,
  currentRole,
  onPreview,
  onEdit,
  onDelete,
  hideClient = false,
}: HistoryRowProps) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const isQuotation = row.documentType === "Quotation";
  let convertedTo = "";
  try {
     const p = JSON.parse(row.payloadJson);
     convertedTo = p.convertedToInvoice || "";
  } catch(e) {}

  const isOwner = currentUser === row.createdBy;
  const isAdmin = currentRole === "admin";
  const canEdit = isAdmin || isOwner;

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const lineItems = React.useMemo(() => {
    try {
      if (!row.payloadJson) return [];
      const parsed = JSON.parse(row.payloadJson);
      return (parsed.lineItems || []).map((item: any) => ({
        ...item,
        unitPrice: item.unitPrice ?? item.amount ?? "0",
        quantity: item.quantity ?? 1
      }));
    } catch {
      return [];
    }
  }, [row.payloadJson]);

  const formatDate = (iso: string) => {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };


  return (
    <>
      <tr className={`group transition-all hover:bg-slate-50/80 relative ${isExpanded ? "bg-slate-50 border-b border-transparent" : "border-b border-slate-100"}`}>
        <td className="px-6 py-4 whitespace-nowrap">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center justify-center h-8 w-8 rounded-lg transition-all ${isExpanded ? "bg-slate-200 text-slate-900" : "hover:bg-slate-100 text-slate-400"}`}
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
          </button>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-[11px] font-medium text-slate-400">
          {formatDate(row.createdAt)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600 uppercase tracking-tighter">
            <Users className="w-3 h-3 mr-1" />
            {row.createdBy || "System"}
          </span>
        </td>

        <td className="px-6 py-4 whitespace-nowrap">
          <button
            onClick={() => onPreview(row)}
            className="flex items-center gap-1.5 font-bold text-brand-primary hover:text-brand-end transition-colors"
          >
            <FileText className="w-4 h-4" />
            {row.invoiceNumber}
          </button>
        </td>

        <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-medium">{row.date}</td>

        {!hideClient && (
          <td className="px-6 py-4 font-bold text-slate-900 hover:text-brand-primary transition-colors cursor-pointer">
            <a href={`/clients/${encodeURIComponent(row.clientName)}`}>
              {row.clientName}
            </a>
          </td>
        )}

        <td className="px-6 py-4 text-slate-500 max-w-[200px] truncate" title={row.subject}>
          {row.subject}
        </td>

        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex flex-col gap-1">
            {row.status === "Paid" || row.status === "Accepted" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                <CheckCircle className="w-3 h-3" />
                {row.status}
              </span>
            ) : (
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase ring-1 ring-inset ${
                  isQuotation ? "bg-amber-50 text-amber-700 ring-amber-600/20" : "bg-rose-50 text-rose-700 ring-rose-600/20"
              }`}>
                <AlertCircle className="w-3 h-3" />
                {row.status || (isQuotation ? "Draft" : "Unpaid")}
              </span>
            )}
            {isQuotation && convertedTo && (
                <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase text-brand-primary tracking-widest">
                  Linked: {convertedTo}
                </span>
            )}
          </div>
        </td>

        <td className="px-6 py-4 text-slate-400 font-bold text-xs">{row.currency}</td>

        <td className="px-6 py-4 text-right tabular-nums text-slate-500 font-medium">
          {row.subtotal}
        </td>

        <td className="px-6 py-4 text-right tabular-nums text-slate-500 font-medium">
          {row.vat}
        </td>

        <td className="px-6 py-4 text-right tabular-nums font-black text-slate-900 bg-slate-50/30">
          {row.total}
        </td>

        <td className="px-6 py-4 text-right relative">
          <div className="relative inline-block text-left" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center justify-center h-9 w-9 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all"
            >
              <MoreVertical className="h-5 w-5" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 z-[100] mt-2 w-48 origin-top-right rounded-2xl bg-white p-1.5 shadow-2xl ring-1 ring-black/5 focus:outline-none animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => { setMenuOpen(false); onPreview(row); }}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-bold text-slate-700 rounded-xl hover:bg-brand-50 hover:text-brand-primary transition-all"
                  >
                   <FileText className="w-4 h-4" />
                   View Details
                  </button>
                  {canEdit && (
                    <button
                      onClick={() => { setMenuOpen(false); onEdit(row); }}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-bold text-slate-700 rounded-xl hover:bg-brand-50 hover:text-brand-primary transition-all"
                    >
                      <Briefcase className="w-4 h-4" />
                      Edit {isQuotation ? "Quotation" : "Invoice"}
                    </button>
                  )}
                   {isQuotation && !convertedTo && (row.status === "Accepted" || row.status === "Pending") && (
                    <button
                      onClick={() => { 
                        setMenuOpen(false); 
                        window.location.href = `/invoice?convertFrom=${row.invoiceNumber}&client=${encodeURIComponent(row.clientName)}`;
                      }}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-bold text-brand-primary rounded-xl hover:bg-brand-50 transition-all"
                    >
                      <FilePlus2 className="w-4 h-4" />
                      Generate Invoice
                    </button>
                  )}
                  {isQuotation && convertedTo && (
                    <button
                      onClick={() => { 
                        setMenuOpen(false); 
                        window.location.href = `/invoice/edit/${convertedTo}?type=Invoice`;
                      }}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-bold text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all"
                    >
                      <FileCheck className="w-4 h-4" />
                      View Linked Invoice
                    </button>
                  )}
                  {canEdit && (
                    <button
                      onClick={() => { setMenuOpen(false); onDelete(row); }}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-bold text-rose-600 rounded-xl hover:bg-rose-50 transition-all"
                    >
                      <AlertCircle className="w-4 h-4" />
                      Delete Permanently
                    </button>
                  )}
              </div>
            )}
          </div>
        </td>
      </tr>
      
      {isExpanded && (
        <tr>
          <td colSpan={hideClient ? 12 : 13} className="px-8 pb-6 pt-0 bg-slate-50/50">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-black/5">
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-brand-primary" />
                    Detailed Line Items
                  </h4>
                  <div className="overflow-hidden rounded-xl border border-slate-100 bg-slate-50/30">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="bg-slate-100/50 text-slate-500 font-bold uppercase tracking-tight border-b border-slate-100">
                          <th className="px-4 py-3 w-12 text-center text-[9px]">#</th>
                          <th className="px-4 py-3">Description</th>
                          <th className="px-4 py-3 text-center w-24">Qty</th>
                          <th className="px-4 py-3 text-right w-32">Unit Price</th>
                          <th className="px-4 py-3 text-right w-32 font-black">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {lineItems.map((item: any, i: number) => (
                          <tr key={i} className="hover:bg-white transition-colors">
                            <td className="px-4 py-3 text-center text-slate-400 font-bold">{i + 1}</td>
                            <td className="px-4 py-3 text-slate-900 font-medium whitespace-pre-line">{item.description}</td>
                            <td className="px-4 py-3 text-center text-slate-600 font-bold">{item.quantity}</td>
                            <td className="px-4 py-3 text-right text-slate-500 tabular-nums">
                                <span className="text-[9px] mr-1 opacity-50">{row.currency}</span>
                                {item.unitPrice}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-900 font-black tabular-nums">
                                <span className="text-[9px] mr-1 text-brand-primary">{row.currency}</span>
                                {(parseFloat(item.unitPrice) * item.quantity).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};
