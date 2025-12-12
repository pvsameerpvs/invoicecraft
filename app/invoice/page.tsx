"use client";

import React, { useRef, useState } from "react";
import { InvoiceForm } from "../../components/InvoiceForm";
import { InvoicePreview } from "../../components/InvoicePreview";
import { InvoiceData } from "../../lib/types";
import { downloadInvoicePdf } from "../../lib/pdf";

const initialInvoiceData: InvoiceData = {
  logoDataUrl: undefined,

  // Label stays fixed
  invoiceTo: "INVOICE TO:",

  // ❌ NO default values (empty)
  invoiceToCompany: "",
  invoiceToAddress: "",
  invoiceNumber: "",
  subject: "",

  // ✅ Always today
  date: new Date().toISOString().slice(0, 10),

  // ✅ Company info locked
  fromCompanyName: "Just Search LLC.",
  fromCompanyAddress:
    "Damas Tower, 305, Al Maktoum Road,\nDeira, Rigga Al Buteen, Dubai. P.O. box 13500.",

  // ❌ NO default line items
  lineItems: [],

  // ✅ Currency default
  currency: "AED",

  // ❌ Let system calculate total (VAT logic)
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

  const handleDownload = async () => {
    if (!previewRef.current) return;
    await downloadInvoicePdf(previewRef.current);
  };

  return (
    <main className="min-h-screen bg-slate-100 p-4 lg:p-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row">
        <section className="w-full lg:w-[360px]">
          <h1 className="mb-4 text-xl font-semibold">Invoice editor</h1>
          <InvoiceForm
            value={invoice}
            onChange={setInvoice}
            onDownloadPdf={handleDownload}
          />
        </section>

        <section className="w-full flex-1 overflow-auto">
          <div className="flex justify-center lg:justify-end">
            <InvoicePreview value={invoice} forwardRef={previewRef} />
          </div>
        </section>
      </div>
    </main>
  );
}
