"use client";

import React, { useRef, useState } from "react";
import { InvoiceForm } from "../../components/InvoiceForm";
import { InvoicePreview } from "../../components/InvoicePreview";
import { InvoiceData } from "../../lib/types";
import { downloadInvoicePdf } from "../../lib/pdf";

const initialInvoiceData: InvoiceData = {
  logoDataUrl: undefined,
  invoiceTo: "INVOICE TO:",
  invoiceToCompany: "",
  invoiceToAddress: "",
  invoiceNumber: "",
  subject: "",
  date: new Date().toISOString().slice(0, 10),
  fromCompanyName: "Just Search Web design L.L.C.",
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

  const handleDownload = async () => {
    if (!previewRef.current) return;
    await downloadInvoicePdf(previewRef.current);
  };

  return (
    <main className="min-h-screen bg-slate-100 p-3 sm:p-4 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 lg:gap-6 lg:flex-row lg:h-[calc(100vh-4rem)] lg:overflow-hidden">
          {/* Form panel (more narrow on desktop, full on mobile) */}
          <section className="w-full lg:w-[300px] xl:w-[280px] lg:h-full lg:overflow-auto">
            <h1 className="mb-3 sm:mb-4 text-lg sm:text-xl font-semibold">
              Invoice editor
            </h1>
            <InvoiceForm
              value={invoice}
              onChange={setInvoice}
              onDownloadPdf={handleDownload}
            />
          </section>

          {/* Preview panel */}
          <section className="w-full flex-1 lg:h-full lg:overflow-auto">
            <div className="flex justify-center lg:justify-end px-1 sm:px-2 lg:px-0">
              <InvoicePreview value={invoice} forwardRef={previewRef} />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
