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
};

export default function InvoicePage() {
  const [invoice, setInvoice] = useState<InvoiceData>(initialInvoiceData);
  const previewRef = useRef<HTMLDivElement | null>(null);

  /* New State for tracking origin of edit */
  const [originalInvoiceNumber, setOriginalInvoiceNumber] = useState<string | null>(null);

  // ✅ Load invoice for editing (from History)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);

      if (parsed && typeof parsed === "object") {
        // merge with initial to avoid missing fields
        setInvoice({ ...initialInvoiceData, ...parsed });
        
        // Track original invoice number if it exists
        if (parsed.invoiceNumber) {
            setOriginalInvoiceNumber(parsed.invoiceNumber);
        }
        
        toast.success("Invoice loaded for editing");
      }

      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
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
            invoice
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
    <div className="flex h-screen flex-col bg-slate-50 text-slate-900">
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
      <main className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Form */}
        <aside className="w-[500px] flex-none overflow-y-auto border-r border-slate-200 bg-white p-6 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300">
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
        <section className="flex flex-1 justify-center overflow-y-auto bg-slate-100/50 p-8 lg:p-12">
            <div className="h-fit">
               <InvoicePreview value={invoice} forwardRef={previewRef} />
            </div>
        </section>
      </main>
    </div>
  );
}
