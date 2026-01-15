"use client";

import React from "react";
import { InvoiceData } from "../lib/types";
import { useTheme } from "./ThemeProvider";

interface InvoicePreviewProps {
  value: InvoiceData;
  forwardRef?: React.Ref<HTMLDivElement>;
}

/**
 * IMPORTANT:
 * - rowsPerPage controls when a new page is created.
 * - If your rows are longer (multi-line descriptions), reduce rowsPerPage (e.g. 10 or 11).
 */
const rowsPerPage = 12;

function chunkArray<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// Helper to format date as DD-MM-YYYY
function formatDate(dateStr?: string) {
  if (!dateStr) return " ";
  try {
     const [y, m, d] = dateStr.split("-");
     if (y && m && d) return `${d}-${m}-${y}`;
     return dateStr;
  } catch {
     return dateStr;
  }
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  value,
  forwardRef,
}) => {
  const { logoUrl } = useTheme();

  const computedTotal = value.lineItems.reduce((sum, item) => {
    const n = parseFloat(item.amount);
    if (!isNaN(n)) return sum + n;
    return sum;
  }, 0);

  const vatRate = 0.05;
  const vatAmount = computedTotal * vatRate;

  const currency =
    value.currency && value.currency.trim().length > 0 ? value.currency : "AED";

  const totalText =
    value.overrideTotal && value.overrideTotal.trim().length > 0
      ? value.overrideTotal
      : (computedTotal + vatAmount).toFixed(2);

  const pages = chunkArray(value.lineItems, rowsPerPage);
  const pagesSafe = pages.length > 0 ? pages : [[]]; // ✅ always at least 1 page

  return (
    <div ref={forwardRef} className="a4-mobile-fit">
      <div className="a4-mobile-scale">
        {pagesSafe.map((pageItems, pageIndex) => {
          const isLastPage = pageIndex === pagesSafe.length - 1;

          return (
            <div
              key={pageIndex}
              className="invoice-paper a4-preview relative mx-auto box-border bg-white px-12 py-10 text-[11px] leading-relaxed overflow-hidden"
              style={{
                width: "210mm",
                minHeight: "297mm",
                pageBreakAfter: isLastPage ? "auto" : "always",
                breakAfter: isLastPage ? "auto" : "page",
              }}
            >
              {/* Logo */}
              <header className="flex flex-col items-center gap-2">
                <img
                  src={
                    value.logoDataUrl && value.logoDataUrl.trim().length > 0
                      ? value.logoDataUrl
                      : (logoUrl || "/logo-js.png")
                  }
                  alt="Logo"
                  className="h-8 object-contain"
                />

                                <h1 className="mt-4 text-3xl font-semibold tracking-wide">
                  TAX INVOICE
                </h1>
                {value.fromCompanyTrn && (
                  <p className="mr-1 text-[10px] uppercase tracking-wide">
                    {value.fromCompanyTrn}
                  </p>
                )}
              </header>

              {/* Top meta (only on first page to keep same UI/spacing) */}
              {pageIndex === 0 && (
                <>
                  <section className="mt-8 flex justify-between text-[11px]">
                    <div className="space-y-1">
                      <div>
                        <span className="font-semibold">INVOICE TO:</span>{" "}
                        <span className="font-semibold">
                          {value.invoiceToCompany}
                        </span>
                      </div>
                      <div className="whitespace-pre-line break-words">
                        {value.invoiceToAddress}
                      </div>
                    </div>
                    <div className="space-y-1 text-right">
                      <div>
                        <span className="mr-1 text-[10px] uppercase tracking-wide">
                          Tax Invoice #
                        </span>
                        <span className="font-semibold">
                          {value.invoiceNumber || " "}
                        </span>
                      </div>
                      <div>
                        <span className="mr-1 text-[10px] uppercase tracking-wide">
                          Date:
                        </span>
                        <span className="font-semibold">
                          {formatDate(value.date)}
                        </span>
                      </div>
                    </div>
                  </section>

                  {/* Subject */}
                  <section className="mt-10 text-[11px]">
                    <span className="font-semibold">Subject: - </span>
                    <span className="uppercase">{value.subject}</span>
                  </section>
                </>
              )}

              {/* Items table */}
              <section className={pageIndex === 0 ? "mt-4" : "mt-8"}>
                <table className="invoice-table w-full table-fixed border-collapse">
                  <thead>
                    <tr>
                      <th className="w-10 bg-gradient-to-r from-brand-start to-brand-primary px-2 py-2 text-left text-[11px] font-semibold uppercase text-white">
                        #
                      </th>
                      <th className="bg-brand-primary px-2 py-2 text-left text-[11px] font-semibold uppercase text-white">
                        Item &amp; Description
                      </th>
                      <th className="w-32 bg-gradient-to-r from-brand-primary to-brand-end px-2 py-2 text-right text-[11px] font-semibold uppercase text-white">
                        Amount
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {pageItems.map((item, rowIndex) => {
                      const globalIndex = pageIndex * rowsPerPage + rowIndex;
                      return (
                        <tr key={item.id} className="border-b border-orange-200">
                          <td className="px-2 py-2 align-top text-[11px]">
                            {globalIndex + 1}
                          </td>
                          <td className="px-2 py-2">
                            <div className="whitespace-pre-line">
                              {item.description || " "}
                            </div>
                          </td>
                          <td className="px-2 py-2 text-right tabular-nums whitespace-nowrap">
                            {item.amount
                              ? `${currency} ${parseFloat(item.amount).toFixed(
                                  2
                                )}`
                              : " "}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Subtotal / VAT / Total ONLY on last page */}
                {isLastPage && (
                  <div className="mt-4 flex justify-end">
                    <div className="w-72 space-y-2 text-right">
                      <div className="text-xs font-semibold tabular-nums whitespace-nowrap">
                        Subtotal (Excl. VAT) {currency}{" "}
                        {Number.isFinite(computedTotal)
                          ? computedTotal.toFixed(2)
                          : "0.00"}
                      </div>

                      <div className="text-xs font-semibold tabular-nums whitespace-nowrap">
                        VAT (5%) {currency} {vatAmount.toFixed(2)}
                      </div>

                      <div className="text-xs font-semibold tabular-nums whitespace-nowrap">
                        Total (Incl. VAT) {currency} {totalText}
                      </div>
                       <div className="text-xs font-semibold tabular-nums whitespace-nowrap">
                       {value.status}
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Bottom company + bank info (only on last page so it stays in same area and doesn't push footer) */}
              {isLastPage && (
                <section className="mt-12 flex-col justify-between text-[11px]">
                  <div className="space-y-1">
                    <div className="font-semibold">{value.fromCompanyName}</div>
                    <div className="whitespace-pre-line">
                      {value.fromCompanyAddress}
                    </div>
                    {value.fromCompanyTrn && (
                      <p className="mr-1 text-[10px] uppercase tracking-wide">
                        {value.fromCompanyTrn}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1 text-[11px] pt-4">
                    <div className="font-semibold uppercase">Payment method</div>
                    <div>
                      <span className="font-semibold">Company Name:</span>{" "}
                      {value.bankDetails.companyName}
                    </div>
                    <div>
                      <span className="font-semibold">
                        {value.bankDetails.bankLabel} -
                      </span>{" "}
                      {value.bankDetails.bankName}
                    </div>
                    <div>
                      <span className="font-semibold">Bank Account:</span>{" "}
                      {value.bankDetails.accountIban}
                    </div>
                    <div>
                      <span className="font-semibold">ACCOUNT#:</span>{" "}
                      {value.bankDetails.accountNumber}
                    </div>
                  </div>
                </section>
              )}

              {/* Footer (every page, exact place) */}
              <footer className="absolute bottom-16 left-12 right-12 text-[10px]">
                <div className="flex items-center justify-center gap-4 text-[10px]">
                  <div className="h-px w-40 bg-slate-500" />
                  <span>{value.signatureLabel}</span>
                  <div className="h-px w-40 bg-slate-500" />
                </div>
              </footer>
            </div>
          );
        })}
      </div>
    </div>
  );
};
