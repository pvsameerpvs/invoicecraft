"use client";

import React from "react";
import { InvoiceData } from "../lib/types";

interface InvoicePreviewProps {
  value: InvoiceData;
  forwardRef?: React.Ref<HTMLDivElement>;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  value,
  forwardRef,
}) => {
  const computedTotal = value.lineItems.reduce((sum, item) => {
    const n = parseFloat(item.amount);
    if (!isNaN(n)) return sum + n;
    return sum;
  }, 0);

  const vatRate = 0.05;
  const vatAmount = computedTotal * vatRate;

  const totalText =
    value.overrideTotal && value.overrideTotal.trim().length > 0
      ? value.overrideTotal
      : (computedTotal + vatAmount).toFixed(2);

  return (
    <div
      ref={forwardRef}
      className="invoice-paper a4-preview relative bg-white px-12 py-10 text-[11px] leading-relaxed"
    >
      {/* Logo */}
      <header className="flex flex-col items-center gap-2">
        <img
          src={
            value.logoDataUrl && value.logoDataUrl.trim().length > 0
              ? value.logoDataUrl
              : "/logo-js.png"
          }
          alt="Logo"
          className="h-12 object-contain"
        />

        <h1 className="mt-4 text-3xl font-semibold tracking-wide">
          TAX INVOICE
        </h1>
      </header>

      {/* Top meta */}
      <section className="mt-8 flex justify-between text-[11px]">
        <div className="space-y-1">
          <div>
            <span className="font-semibold">INVOICE TO:</span>{" "}
            <span className="font-semibold">{value.invoiceToCompany}</span>
          </div>
          <div className="whitespace-pre-line break-words">
            {value.invoiceToAddress}
          </div>
        </div>
        <div className="space-y-1 text-right">
          <div>
            <span className="mr-1 text-[10px] uppercase tracking-wide">
              Invoice #
            </span>
            <span className="font-semibold">{value.invoiceNumber || " "}</span>
          </div>
          <div>
            <span className="mr-1 text-[10px] uppercase tracking-wide">
              Date:
            </span>
            <span className="font-semibold">{value.date || " "}</span>
          </div>
        </div>
      </section>

      {/* Subject */}
      <section className="mt-10 text-[11px]">
        <span className="font-semibold">Subject: - </span>
        <span className="uppercase">{value.subject}</span>
      </section>

      {/* Items table */}
      <section className="mt-4">
        <table className="invoice-table w-full border-collapse">
          <thead>
            <tr>
              <th className="w-10 bg-black px-2 py-2 text-left text-[11px] font-semibold uppercase text-white">
                #
              </th>
              <th className="bg-black px-2 py-2 text-left text-[11px] font-semibold uppercase text-white">
                Item &amp; Description
              </th>
              <th className="w-32 bg-black px-2 py-2 text-right text-[11px] font-semibold uppercase text-white">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {value.lineItems.map((item, index) => (
              <tr key={item.id} className="border-b border-slate-300">
                <td className="px-2 py-2 align-top text-[11px]">{index + 1}</td>
                <td className="px-2 py-2">
                  <div className="whitespace-pre-line">
                    {item.description || " "}
                  </div>
                </td>
                <td className="px-2 py-2 text-right tabular-nums">
                  {item.amount
                    ? `${value.currency} ${parseFloat(item.amount).toFixed(2)}`
                    : " "}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* VAT */}
        <div className="mt-4 flex justify-end">
          <div className="text-xs font-semibold">
            VAT (5%) {value.currency} {vatAmount.toFixed(2)}
          </div>
        </div>

        {/* Total */}
        <div className="mt-2 flex justify-end">
          <div className="text-xs font-semibold">
            Total {value.currency} {totalText}
          </div>
        </div>
      </section>

      {/* Bottom company + bank info */}
      <section className="mt-12 flex justify-between text-[11px]">
        <div className="space-y-1">
          <div className="font-semibold">{value.fromCompanyName}</div>
          <div className="whitespace-pre-line">{value.fromCompanyAddress}</div>
        </div>
        <div className="space-y-1 text-[11px]">
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

      {/* Footer */}
      <footer className="absolute bottom-16 left-12 right-12 text-[10px]">
        <div className="flex items-center justify-center gap-4 text-[10px]">
          <div className="h-px w-40 bg-slate-500" />
          <span>{value.signatureLabel}</span>
          <div className="h-px w-40 bg-slate-500" />
        </div>
      </footer>
    </div>
  );
};
