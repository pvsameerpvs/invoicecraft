"use client";

import React from "react";
import { InvoiceData } from "@/lib/types";
import { useTheme } from "@/components/ThemeProvider";
import { BUSINESS_PROFILES } from "@/lib/businessProfiles";

interface ModernTemplateProps {
    value: InvoiceData;
}


function chunkArray<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

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

export const ModernTemplate: React.FC<ModernTemplateProps> = ({ value }) => {
  const { logoUrl, logoSize } = useTheme();
  const profileConfig = BUSINESS_PROFILES[value.businessProfile || "Product"] || BUSINESS_PROFILES["Product"];

  const rowsPerPage = 10;

  const computedTotal = value.lineItems.reduce((sum, item) => {
    const price = parseFloat(item.unitPrice);
    const qty = item.quantity || 1;
    if (!isNaN(price)) return sum + (price * qty);
    return sum;
  }, 0);

  const vatRate = 0.05;
  const vatAmount = computedTotal * vatRate;
  const currency = value.currency?.trim() || "AED";
  const totalText = value.overrideTotal?.trim() || (computedTotal + vatAmount).toFixed(2);

  const pages = chunkArray(value.lineItems, rowsPerPage);
  
  // Refined split logic: only move footer to a new page if the LAST page of items has > 4 items
  const lastPageItemsCount = pages.length > 0 ? pages[pages.length - 1].length : 0;
  const hasSplit = lastPageItemsCount > 4;

  const pagesSafe = hasSplit 
    ? [...pages, []] 
    : (pages.length > 0 ? pages : [[]]);

  return (
    <>
      {pagesSafe.map((pageItems, pageIndex) => {
        const isLastPage = pageIndex === pagesSafe.length - 1;
        const isLastItemPage = pageIndex === pages.length - 1;
        const showSummary = isLastItemPage;
        const showBankInfo = hasSplit ? isLastPage : false; // Bank info only on extra page if split

        return (
          <div
            key={pageIndex}
            className="invoice-paper a4-preview relative mx-auto box-border bg-white text-slate-800 text-[11px] leading-relaxed overflow-hidden font-sans"
            style={{
              width: "210mm",
              minHeight: "297mm",
              pageBreakAfter: isLastPage ? "auto" : "always",
              breakAfter: isLastPage ? "auto" : "page",
            }}
          >
            {/* Header - Full Width Colored */}
            <header className="flex justify-between items-start px-12 py-8 bg-brand-primary/5 border-b border-brand-primary/10">
                <div className="flex flex-col gap-4">
                    <img
                        src={value.logoDataUrl?.trim() || (logoUrl || "/logo-js.png")}
                        alt="Logo"
                        className="w-auto object-contain object-left"
                        style={{ height: `${logoSize}px`, maxWidth: '250px' }}
                    />
                     <div className="space-y-1">
                        <div className="font-bold text-slate-900 text-sm">{value.fromCompanyName}</div>
                        <div className="whitespace-pre-line text-slate-500 max-w-[300px]">
                            {value.fromCompanyAddress}
                        </div>
                        {value.fromCompanyTrn && (
                            <p className="text-[10px] text-slate-400 font-medium">
                                TRN: {value.fromCompanyTrn}
                            </p>
                        )}
                    </div>
                </div>

                <div className="text-right">
                    <h1 className="text-4xl font-bold text-brand-primary tracking-tight">INVOICE</h1>
                    <div className="mt-4 space-y-1">
                         <div className="flex justify-end gap-3">
                            <span className="text-slate-400 uppercase tracking-wider font-semibold text-[10px]">Reference</span>
                            <span className="font-bold text-slate-700">{value.invoiceNumber || "N/A"}</span>
                        </div>
                        <div className="flex justify-end gap-3">
                            <span className="text-slate-400 uppercase tracking-wider font-semibold text-[10px]">Date</span>
                            <span className="font-bold text-slate-700">{formatDate(value.date)}</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Bill To & Subject */}
            {pageIndex === 0 && (
                <div className="px-12 mt-8 grid grid-cols-2 gap-12">
                     <div>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-2">Bill To</span>
                        <div className="font-bold text-lg text-slate-900 mb-1">{value.invoiceToCompany}</div>
                        <div className="whitespace-pre-line text-slate-600">
                             {value.invoiceToAddress}
                        </div>
                    </div>
                    <div>
                         <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-2">Subject</span>
                         <div className="text-slate-700 font-medium">{value.subject || "N/A"}</div>
                    </div>
                </div>
            )}

            {/* Items Table - Clean & Modern */}
            {(pageItems.length > 0 || pageIndex === 0) && (
                <div className={`px-12 ${pageIndex === 0 ? "mt-8" : "mt-8"}`}>
                    <table className="w-full table-fixed border-collapse">
                        <thead>
                             <tr className="border-b-2 border-slate-100">
                                <th className="w-12 py-3 text-left text-[10px] font-bold uppercase text-slate-400 tracking-wider whitespace-nowrap">{profileConfig.headers.no}</th>
                                <th className="py-3 text-left text-[10px] font-bold uppercase text-slate-400 tracking-wider">{profileConfig.headers.desc}</th>
                                <th className="w-16 py-3 text-center text-[10px] font-bold uppercase text-slate-400 tracking-wider whitespace-nowrap">{profileConfig.headers.qty}</th>
                                <th className="w-24 py-3 text-right text-[10px] font-bold uppercase text-slate-400 tracking-wider whitespace-nowrap">{profileConfig.headers.price}</th>
                                <th className="w-32 py-3 text-right text-[10px] font-bold uppercase text-slate-400 tracking-wider whitespace-nowrap">{profileConfig.headers.total}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {pageItems.map((item, rowIndex) => {
                                 const globalIndex = pageIndex * rowsPerPage + rowIndex;
                                 return (
                                    <tr key={item.id}>
                                        <td className="py-4 align-top text-slate-400 font-medium">{globalIndex + 1}</td>
                                        <td className="py-4 align-top text-slate-700 whitespace-pre-line leading-relaxed">{item.description}</td>
                                        <td className="py-4 align-top text-center text-slate-700 font-medium tabular-nums">{item.quantity || 1}</td>
                                        <td className="py-4 align-top text-right text-slate-700 font-medium tabular-nums">
                                            {item.unitPrice ? parseFloat(item.unitPrice).toFixed(2) : "0.00"}
                                        </td>
                                        <td className="py-4 align-top text-right font-bold text-slate-900 tabular-nums">
                                            {item.unitPrice ? (parseFloat(item.unitPrice) * (item.quantity || 1)).toFixed(2) : "-"}
                                        </td>
                                    </tr>
                                 );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Totals & Bank Info */}
            {showSummary && (
                <div className="px-12 mt-4">
                     {/* Totals Box */}
                     <div className="flex justify-end">
                        <div className="w-1/2 bg-slate-50 rounded-lg p-6 space-y-3">
                            <div className="flex justify-between text-slate-500">
                                <span>Subtotal</span>
                                <span className="font-semibold text-slate-900">{currency} {Number.isFinite(computedTotal) ? computedTotal.toFixed(2) : "0.00"}</span>
                            </div>
                            <div className="flex justify-between text-slate-500">
                                <span>VAT (5%)</span>
                                <span className="font-semibold text-slate-900">{currency} {vatAmount.toFixed(2)}</span>
                            </div>
                            <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                                <span className="font-bold text-slate-900">Total</span>
                                <span className="font-bold text-xl text-brand-primary">{currency} {totalText}</span>
                            </div>
                             <div className="text-right text-[10px] text-slate-400 uppercase tracking-wide font-medium mt-1">
                                {value.status}
                            </div>
                        </div>
                     </div>
                </div>
            )}

            {showBankInfo && (
                <div className="px-12 mt-4">
                     {/* Bank Info & Footer Note */}
                       <div className="mt-8 grid grid-cols-2 gap-8">
                        <div>
                             <h3 className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-3">Bank Details</h3>
                             <div className="space-y-1.5 text-slate-600 bg-white border border-slate-100 rounded-lg p-4">
                                <div className="flex justify-between"><span className="text-slate-400">Bank:</span> <span className="font-semibold">{value.bankDetails.bankName}</span></div>
                                <div className="flex justify-between"><span className="text-slate-400">Account Name:</span> <span className="font-semibold">{value.bankDetails.companyName}</span></div>
                                <div className="flex justify-between"><span className="text-slate-400">IBAN:</span> <span className="font-semibold">{value.bankDetails.accountIban}</span></div>
                                <div className="flex justify-between"><span className="text-slate-400">Account No:</span> <span className="font-semibold">{value.bankDetails.accountNumber}</span></div>
                             </div>
                        </div>
                        
                         <div className="flex flex-col justify-end">
                             {/* Signature */}
                             <div className="flex flex-col items-center gap-2 mb-4">
                                 <div className="h-px w-32 bg-slate-300"></div>
                                 <span className="text-[10px] uppercase text-slate-400 font-semibold">{value.signatureLabel}</span>
                             </div>
                        </div>
                     </div>
                </div>
            )}

             {/* Footer Bar */}
            <footer className="absolute bottom-0 left-0 right-0 bg-brand-primary/5 border-t border-brand-primary/10 px-12 py-4 flex flex-col items-center text-[10px] text-slate-500">
                 {isLastPage && value.footerNote && (
                    <div className="mb-4 text-center max-w-2xl">
                        <span className="block text-[8px] uppercase font-bold tracking-widest text-brand-primary/40 mb-1">Terms & Conditions</span>
                        <p className="text-[9px] text-slate-400 whitespace-pre-line leading-relaxed italic">{value.footerNote}</p>
                    </div>
                 )}
                 <div className="flex justify-between w-full items-center">
                    <span>{value.bankDetails.companyName}</span>
                    <span>Thank you for your business</span>
                 </div>
             </footer>
          </div>
        );
      })}
    </>
  );
};
