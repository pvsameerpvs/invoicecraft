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

  const isQuotation = value.documentType === "Quotation";
  const rowsPerPage = 10;

  const computedTotal = value.lineItems.reduce((sum, item) => {
    const price = parseFloat(item.unitPrice);
    const qty = item.quantity || 1;
    if (!isNaN(price)) return sum + (price * qty);
    return sum;
  }, 0);

  const vatRate = 0.05;
  const vatAmount = computedTotal * vatRate;
  const discountAmount = parseFloat(value.discount || "0");

  const currency =
    value.currency && value.currency.trim().length > 0 ? value.currency : "AED";

  const totalText =
    value.overrideTotal && value.overrideTotal.trim().length > 0
      ? value.overrideTotal
      : (computedTotal + vatAmount - discountAmount).toFixed(2);

  const pages = chunkArray(value.lineItems, rowsPerPage);
  
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
                fontFamily: isQuotation ? "'Inter', sans-serif" : "inherit"
              }}
            >
              {/* Header */}
              {isQuotation ? (
                <div className="space-y-4">
                  <header className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <img
                        src={
                          value.logoDataUrl && value.logoDataUrl.trim().length > 0
                            ? value.logoDataUrl
                            : (logoUrl || "/logo-js.png")
                        }
                        alt="Logo"
                        className="h-20 w-auto max-w-[200px] object-contain"
                      />
                      <div>
                         <h2 className="text-xl font-bold text-brand-primary">{value.fromCompanyName}</h2>
                         <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{value.fromCompanyTrn}</p>
                      </div>
                    </div>
                    <div className="text-right text-[10px] space-y-0.5 text-slate-700">
                      <p className="whitespace-pre-line">{value.fromCompanyAddress}</p>
                      <p className="font-semibold text-brand-primary">{value.fromCompanyEmail}</p>
                      <p className="font-semibold text-brand-primary">{value.fromCompanyPhone}</p>
                    </div>
                  </header>
                  <div className="h-1 bg-gradient-to-r from-brand-start to-brand-end w-full mt-2 rounded-full" />
                  
                  {pageIndex === 0 && (
                    <div className="text-center py-6">
                      <h1 className="text-3xl font-black bg-gradient-to-r from-brand-start to-brand-end bg-clip-text text-transparent uppercase tracking-[6px]">Price Quote</h1>
                    </div>
                  )}
                </div>
              ) : (
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
              )}

              {/* Top meta */}
              {pageIndex === 0 && (
                <section className={`mt-8 flex justify-between text-[11px] ${isQuotation ? 'border-b-2 border-slate-100 pb-6' : ''}`}>
                  <div className="space-y-1">
                    <div>
                      <span className="font-bold text-slate-400 uppercase tracking-tight">{isQuotation ? "Quotation for:" : "INVOICE TO:"}</span>{" "}
                      <span className={`font-bold ${isQuotation ? 'text-xl block mt-1 text-slate-900' : ''}`}>
                        {value.invoiceToCompany}
                      </span>
                    </div>
                    <div className="whitespace-pre-line break-words text-slate-500 font-medium">
                      {value.invoiceToAddress}
                    </div>
                  </div>
                  <div className={`space-y-1 text-right ${isQuotation ? 'pt-8' : ''}`}>
                    <div>
                      <span className="mr-2 text-[10px] uppercase tracking-wider font-bold text-slate-400">
                        {isQuotation ? "Date:" : "Tax Invoice #"}
                      </span>
                      <span className="font-bold text-slate-900">
                        {isQuotation ? formatDate(value.date) : (value.invoiceNumber || " ")}
                      </span>
                    </div>
                    <div>
                      <span className="mr-2 text-[10px] uppercase tracking-wider font-bold text-slate-400">
                        {isQuotation ? "Quotation #:" : "Date:"}
                      </span>
                      <span className="font-bold text-brand-primary">
                        {isQuotation ? (value.invoiceNumber || " ") : formatDate(value.date)}
                      </span>
                    </div>
                    {isQuotation && value.validityDate && (
                      <div>
                        <span className="mr-2 text-[10px] uppercase tracking-wider font-bold text-slate-400">
                          Valid Until:
                        </span>
                        <span className="font-bold text-rose-600">
                          {formatDate(value.validityDate)}
                        </span>
                      </div>
                    )}
                    {!isQuotation && value.sourceQuotation && (
                      <div className="mt-1">
                        <span className="mr-2 text-[10px] uppercase tracking-wider font-bold text-slate-400">
                          Ref. Quotation:
                        </span>
                        <span className="font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                          {value.sourceQuotation}
                        </span>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {pageIndex === 0 && value.subject && (
                <section className={`${isQuotation ? 'mt-6 bg-slate-50 p-4 rounded-xl border border-slate-100' : 'mt-10'} text-[11px]`}>
                  <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px] block mb-1">Subject / Project:</span>
                  <span className={`font-black uppercase tracking-tight ${isQuotation ? 'text-sm text-slate-900' : ''}`}>{value.subject}</span>
                </section>
              )}

              {/* Items table */}
              {(pageItems.length > 0 || pageIndex === 0) && (
                <section className={pageIndex === 0 ? (isQuotation ? "mt-10" : "mt-6") : "mt-8"}>
                  <table className="invoice-table w-full table-fixed border-collapse">
                    <thead>
                      <tr>
                        <th className={`w-20 px-3 py-3 text-left text-[10px] font-bold uppercase text-white ${isQuotation ? 'bg-brand-primary' : 'bg-brand-primary'} rounded-tl-lg`}>
                          Item No.
                        </th>
                        <th className={`px-3 py-3 text-center text-[10px] font-bold uppercase text-white ${isQuotation ? 'bg-brand-primary' : 'bg-brand-primary'}`}>
                          Description
                        </th>
                        <th className={`w-20 px-3 py-3 text-center text-[10px] font-bold uppercase text-white ${isQuotation ? 'bg-brand-primary' : 'bg-brand-primary'}`}>
                          Qty
                        </th>
                        <th className={`w-28 px-3 py-3 text-right text-[10px] font-bold uppercase text-white ${isQuotation ? 'bg-brand-primary' : 'bg-brand-primary'}`}>
                          Unit Price
                        </th>
                        <th className={`w-32 px-3 py-3 text-right text-[10px] font-bold uppercase text-white ${isQuotation ? 'bg-brand-primary' : 'bg-brand-primary'} rounded-tr-lg`}>
                          Total
                        </th>
                      </tr>
                    </thead>

                    <tbody className={isQuotation ? "border-x border-b border-slate-100" : ""}>
                      {pageItems.map((item, rowIndex) => {
                        const globalIndex = pageIndex * rowsPerPage + rowIndex;
                        return (
                          <tr key={item.id} className={`border-b border-slate-100 ${isQuotation ? '' : 'border-brand-200'}`}>
                            <td className="px-3 py-4 align-middle text-[11px] text-center text-slate-400 font-bold">
                              {(globalIndex + 1).toString().padStart(3, '0')}
                            </td>
                            <td className="px-3 py-4 align-middle text-center text-slate-900 font-medium">
                              <div className="whitespace-pre-line">
                                {item.description || " "}
                              </div>
                            </td>
                            <td className="px-3 py-4 text-center align-middle tabular-nums text-slate-900 font-bold">
                              {item.quantity || 1}
                            </td>
                            <td className="px-3 py-4 text-right align-middle tabular-nums text-slate-500">
                              <span className="text-[9px] mr-1 opacity-50">{currency}</span>
                              {item.unitPrice
                                ? parseFloat(item.unitPrice).toFixed(2)
                                : "0.00"}
                            </td>
                            <td className="px-3 py-4 text-right align-middle tabular-nums whitespace-nowrap font-bold text-slate-900">
                              <span className="text-[9px] mr-1 text-brand-primary">{currency}</span>
                              {item.unitPrice
                                ? (
                                    parseFloat(item.unitPrice) *
                                    (item.quantity || 1)
                                  ).toFixed(2)
                                : "0.00"}
                            </td>
                          </tr>
                        );
                      })}
                      
                      {/* Subtotal, VAT, Discount rows for Quotation style */}
                      {showSummary && isQuotation && (
                        <>
                          <tr className="border-b border-slate-50">
                            <td colSpan={3} className="px-3 py-3"></td>
                            <td className="px-3 py-3 text-right font-bold text-slate-400 uppercase text-[9px]">Subtotal</td>
                            <td className="px-3 py-3 text-right tabular-nums font-bold text-slate-900">
                              {currency} {computedTotal.toFixed(2)}
                            </td>
                          </tr>
                          {discountAmount > 0 && (
                            <tr className="border-b border-slate-50">
                              <td colSpan={3} className="px-3 py-3"></td>
                              <td className="px-3 py-3 text-right font-bold text-slate-400 uppercase text-[9px]">Discount</td>
                              <td className="px-3 py-3 text-right tabular-nums font-bold text-emerald-600">
                                -{currency} {discountAmount.toFixed(2)}
                              </td>
                            </tr>
                          )}
                          <tr>
                            <td colSpan={3} className="px-3 py-3 text-[9px] font-bold text-slate-400 italic">
                                * VAT (5%) included in final amount
                            </td>
                            <td className="px-3 py-3 text-right font-bold text-slate-400 uppercase text-[9px]">VAT (5%)</td>
                            <td className="px-3 py-3 text-right tabular-nums font-bold text-slate-900">
                              {currency} {vatAmount.toFixed(2)}
                            </td>
                          </tr>
                          <tr className="bg-gradient-to-r from-brand-start to-brand-end">
                            <td colSpan={3} className="px-3 py-4 rounded-bl-lg"></td>
                            <td className="px-3 py-4 text-right font-black text-white uppercase text-[11px] tracking-wider">Total Quoted Amount</td>
                            <td className="px-3 py-4 text-right tabular-nums font-black text-white text-xl rounded-br-lg">
                              {currency} {totalText}
                            </td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </section>
              )}

                {/* Standard Invoice Summary Side-by-Side */}
              {showSummary && !isQuotation && (
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

              {/* Terms & Conditions / Footer info */}
              {isLastPage && (
                <div className={`mt-12 ${isQuotation ? 'space-y-8' : ''}`}>
                  {isQuotation && value.footerNote && (
                    <section className="space-y-3">
                      <h3 className="text-[11px] font-bold text-brand-primary uppercase border-b border-slate-100 pb-2 tracking-wider">Terms & Conditions:</h3>
                      <div className="text-[10px] text-slate-600 leading-relaxed whitespace-pre-line pl-2 border-l-2 border-brand-primary">
                        {value.footerNote.split('\n').map((line, i) => (
                           <div key={i} className="flex gap-2 items-start mb-1">
                              <span className="text-brand-primary font-bold">•</span>
                              <span>{line}</span>
                           </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {!isQuotation && showBankInfo && (
                     // ... existing bank info ...
                     <section className="mt-8 flex-col justify-between text-[11px]">
                     <div className="space-y-1">
                       <div className="font-semibold text-brand-primary">{value.fromCompanyName}</div>
                       <div className="whitespace-pre-line text-slate-600">
                         {value.fromCompanyAddress}
                       </div>
                       {value.fromCompanyTrn && (
                         <p className="mr-1 text-[10px] uppercase tracking-wide font-bold text-slate-400">
                           {value.fromCompanyTrn}
                         </p>
                       )}
                     </div>
   
                     <div className="space-y-1 text-[11px] pt-4">
                       <div className="font-bold uppercase text-brand-primary tracking-tight">Payment method</div>
                       <div className="text-slate-700">
                         <span className="font-bold text-slate-400">Company Name:</span>{" "}
                         {value.bankDetails.companyName}
                       </div>
                       <div className="text-slate-700">
                         <span className="font-bold text-slate-400">
                           {value.bankDetails.bankLabel}:
                         </span>{" "}
                         {value.bankDetails.bankName}
                       </div>
                       <div className="text-slate-700">
                         <span className="font-bold text-slate-400">IBAN:</span>{" "}
                         {value.bankDetails.accountIban}
                       </div>
                       <div className="text-slate-700">
                         <span className="font-bold text-slate-400">A/C #:</span>{" "}
                         {value.bankDetails.accountNumber}
                       </div>
                     </div>
                   </section>
                  )}

                  {isQuotation && (
                    <div className="pt-12 text-center space-y-4">
                       <p className="text-sm font-bold text-brand-primary">Thank you for considering {value.fromCompanyName}!</p>
                       <div className="flex flex-col items-center">
                          <div className="h-0.5 w-48 bg-gradient-to-r from-transparent via-brand-primary to-transparent mb-2"></div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{value.signatureLabel || "Authorized Signature"}</span>
                       </div>
                    </div>
                  )}
                </div>
              )}

              {/* Standard Footer */}
              {!isQuotation && (
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
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
