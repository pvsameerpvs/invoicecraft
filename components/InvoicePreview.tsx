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

  const rowsPerPage = 10;

  const computedTotal = value.lineItems.reduce((sum, item) => {
    const price = parseFloat(item.unitPrice);
    const qty = item.quantity || 1;
    if (!isNaN(price)) return sum + (price * qty);
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
  
  // Refined split logic: only move footer to a new page if the LAST page of items has > 4 items
  const lastPageItemsCount = pages.length > 0 ? pages[pages.length - 1].length : 0;
  const hasSplit = lastPageItemsCount > 4;

  const pagesSafe = hasSplit 
    ? [...pages, []] 
    : (pages.length > 0 ? pages : [[]]);

  return (
    <div ref={forwardRef} className="a4-mobile-fit">
      <div className="a4-mobile-scale">
        {pagesSafe.map((pageItems, pageIndex) => {
        const isLastPage = pageIndex === pagesSafe.length - 1;
        const isLastItemPage = pageIndex === pages.length - 1;
        const showSummary = isLastItemPage;
        const showBankInfo = hasSplit ? isLastPage : isLastPage;

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
                  className="h-20 w-auto max-w-[250px] object-contain"
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
              {(pageItems.length > 0 || pageIndex === 0) && (
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
                        <th className="w-16 bg-brand-primary px-2 py-2 text-center text-[11px] font-semibold uppercase text-white">
                          Qty
                        </th>
                        <th className="w-24 bg-brand-primary px-2 py-2 text-right text-[11px] font-semibold uppercase text-white">
                          Unit Price
                        </th>
                        <th className="w-32 bg-gradient-to-r from-brand-primary to-brand-end px-2 py-2 text-right text-[11px] font-semibold uppercase text-white">
                          Total Amount
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {pageItems.map((item, rowIndex) => {
                        const globalIndex = pageIndex * rowsPerPage + rowIndex;
                        return (
                          <tr key={item.id} className="border-b border-brand-200">
                            <td className="px-2 py-2 align-top text-[11px]">
                              {globalIndex + 1}
                            </td>
                            <td className="px-2 py-2">
                              <div className="whitespace-pre-line">
                                {item.description || " "}
                              </div>
                            </td>
                            <td className="px-2 py-2 text-center tabular-nums">
                              {item.quantity || 1}
                            </td>
                            <td className="px-2 py-2 text-right tabular-nums">
                              {item.unitPrice
                                ? parseFloat(item.unitPrice).toFixed(2)
                                : "0.00"}
                            </td>
                            <td className="px-2 py-2 text-right tabular-nums whitespace-nowrap">
                              {item.unitPrice
                                ? `${currency} ${(
                                    parseFloat(item.unitPrice) *
                                    (item.quantity || 1)
                                  ).toFixed(2)}`
                                : " "}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </section>
              )}

                {/* Subtotal / VAT / Total ONLY on page with last items */}
              {showSummary && (
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

              {/* Bottom company + bank info */}
              {showBankInfo && (
                <section className="mt-8 flex-col justify-between text-[11px]">
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
                {isLastPage && value.footerNote && (
                  <div className="mb-8 text-center max-w-[80%] mx-auto">
                    <div className="font-bold uppercase text-[8px] text-slate-400 tracking-widest mb-1">Terms & Conditions</div>
                    <div className="text-[9px] text-slate-500 leading-relaxed whitespace-pre-line text-center">
                      {value.footerNote}
                    </div>
                  </div>
                )}
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
