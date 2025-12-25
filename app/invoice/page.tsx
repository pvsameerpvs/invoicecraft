"use client";

import React, { useEffect, useRef, useState } from "react";
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
    <main className="min-h-screen bg-orange-50/50 p-4 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:h-[calc(100vh-4rem)] lg:overflow-hidden">
          <section className="w-full lg:w-[280px] xl:w-[260px] lg:h-full lg:overflow-auto">
            <UserMenu />
            <h1 className="mb-4 text-xl font-semibold">Invoice editor</h1>
            <InvoiceForm
              value={invoice}
              onChange={setInvoice}
              onDownloadPdf={handleDownload}
            />
          </section>

          <section className="w-full flex-1 lg:h-full lg:overflow-auto">
            <div className="flex justify-center lg:justify-end">
              <InvoicePreview value={invoice} forwardRef={previewRef} />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
