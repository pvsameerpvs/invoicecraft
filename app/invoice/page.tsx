"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { InvoiceForm } from "../../components/InvoiceForm";
import { InvoicePreview } from "../../components/InvoicePreview";
import { UserMenu } from "../../components/UserMenu";
import { InvoiceData } from "../../lib/types";
import { downloadInvoicePdf } from "../../lib/pdf";
import toast from "react-hot-toast";

const STORAGE_KEY = "invoicecraft:editInvoicePayload";

const initialInvoiceData: InvoiceData = {
  logoDataUrl: undefined,
  invoiceTo: "INVOICE TO:",
  invoiceToCompany: "",
  invoiceToAddress: "",
  invoiceNumber: "",
  subject: "",
  date: new Date().toISOString().slice(0, 10),
  fromCompanyName: "Just Search LLC.",
  fromCompanyAddress:
    "Damas Tower, 305, Al Maktoum Road,\nDeira, Rigga Al Buteen, Dubai. P.O. box 13500.",
  lineItems: [],
  currency: "AED",
  overrideTotal: "",
  footerNote: "Computer Generated",
  bankDetails: {
    companyName: "HELLO VISION EVENTS LLC",
    bankName: "ADCB",
    bankLabel: "Bank",
    accountIban: "AE720030014006537820001",
    accountNumber: "14006537820001",
  },
  signatureLabel: "Computer Generated",
  status: "Unpaid",
};

export default function InvoicePage() {
  const [invoice, setInvoice] = useState<InvoiceData>(initialInvoiceData);
  const previewRef = useRef<HTMLDivElement | null>(null);

  /* New State for tracking origin of edit */
  const [originalInvoiceNumber, setOriginalInvoiceNumber] = useState<string | null>(null);

  // ✅ Load invoice for editing (from History) or Generate New
  useEffect(() => {
    const init = async () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            
            // 1. If EDITING existing invoice
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === "object") {
                   setInvoice({ ...initialInvoiceData, ...parsed });
                   if (parsed.invoiceNumber) {
                     setOriginalInvoiceNumber(parsed.invoiceNumber);
                   }
                   toast.success("Invoice loaded for editing");
                }
                localStorage.removeItem(STORAGE_KEY);
                return;
            }

            // 2. If NEW invoice, fetch latest number to increment
             try {
                setInvoice(prev => ({...prev, invoiceNumber: "Loading..."}));
                
                const res = await fetch("/api/invoice-history");
                const history = await res.json();
                
                const currentYear = new Date().getFullYear();
                let nextNum = `INV-${currentYear}-000001`; // Default for new year/start
                
                if (Array.isArray(history) && history.length > 0) {
                   const latest = history[0]; // Newest first
                   // Try to match new format: INV-YYYY-XXXXXX
                   const matchNew = (latest.invoiceNumber || "").match(/INV-(\d{4})-(\d+)/);
                   
                   if (matchNew) {
                      const lastYear = parseInt(matchNew[1], 10);
                      const lastSeq = parseInt(matchNew[2], 10);
                      
                      if (lastYear === currentYear) {
                          const nextSeq = lastSeq + 1;
                          nextNum = `INV-${currentYear}-${String(nextSeq).padStart(6, "0")}`;
                      } else {
                          // New year, restart sequence
                          nextNum = `INV-${currentYear}-000001`;
                      }
                   } else {
                      // Fallback: If previous format was different (e.g. INV-001 or timestamp), start new format
                      // We ignore the old sequence and start fresh for the new year format
                      nextNum = `INV-${currentYear}-000001`;
                   }
                }
                
                setInvoice(prev => ({...prev, invoiceNumber: nextNum}));

             } catch (err) {
                 console.error("Failed to fetch history", err);
                 // Fallback to timestamp if fetch fails
                 setInvoice(prev => ({...prev, invoiceNumber: `INV-${Date.now()}`}));
             }

        } catch {
             // ignore localStorage errors
        }
    };

    init();
  }, []);

  const handleDownload = async () => {
    const t = toast.loading("Saving & Generating PDF…");
    const isUpdate = originalInvoiceNumber && invoice.invoiceNumber === originalInvoiceNumber;

    try {
      let res;
      
      if (isUpdate) {
        // ✅ UPDATE existing invoice
         res = await fetch("/api/invoice-history", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            originalInvoiceNumber,
            invoice,
            currentUser: localStorage.getItem("invoicecraft:username") || ""
          }),
        });
      } else {
        // ✅ CREATE new invoice (or if invoice number changed)
        res = await fetch("/api/invoice-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...invoice,
            createdBy: localStorage.getItem("invoicecraft:username") || "Unknown",
          }),
        });
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save invoice history");
      }

      if (!previewRef.current) throw new Error("Preview not ready");
      await downloadInvoicePdf(previewRef.current);

      toast.success("Downloaded successfully!", { id: t });
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to download", { id: t });
    }
  };

  return (
    <div className="flex min-h-screen lg:h-screen flex-col bg-slate-50 text-slate-900">
      {/* 1. Header */}
      <header className="flex h-16 flex-none items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
        <div className="flex items-center gap-4">
        <Image src="/logo-js.png" alt="Logo" width={150} height={150} className="w-[100px] h-auto sm:w-[150px]" />
          <span className="hidden rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-brand-primary sm:inline-flex">
            v1.0 Editor
          </span>
        </div>
        <UserMenu />
      </header>

      {/* 2. Main Layout (Sidebar + Preview) */}
      <main className="flex flex-1 flex-col lg:flex-row lg:overflow-hidden">
        {/* Left Sidebar: Form */}
        <aside className="w-full lg:w-[500px] flex-none lg:overflow-y-auto border-r border-slate-200 bg-white p-4 sm:p-6 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300 z-10 ">
           <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Invoice Details</h2>
              <div className="text-xs text-slate-500">Auto-saving...</div>
           </div>
           
           <InvoiceForm
              value={invoice}
              onChange={setInvoice}
              onDownloadPdf={handleDownload}
            />
        </aside>

        {/* Right Content: PDF Preview */}
        <section className="flex flex-1 justify-center lg:overflow-y-auto bg-slate-100/50 p-4 lg:p-12">
            <div className="h-fit w-full flex justify-center">
               <InvoicePreview value={invoice} forwardRef={previewRef} />
            </div>
        </section>
      </main>
    </div>
  );
}
