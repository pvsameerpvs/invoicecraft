"use client";

import { InvoiceData, LineItem } from "../lib/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import React from "react";

interface InvoiceFormProps {
  value: InvoiceData;
  onChange: (next: InvoiceData) => void;
  onDownloadPdf: () => void;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  value,
  onChange,
  onDownloadPdf
}) => {
  const handleFieldChange = (
    field: keyof InvoiceData,
    newValue: string
  ) => {
    onChange({ ...value, [field]: newValue });
  };

  const handleLineItemChange = (
    id: string,
    field: keyof LineItem,
    newValue: string
  ) => {
    const lineItems = value.lineItems.map((item) =>
      item.id === id ? { ...item, [field]: newValue } : item
    );
    onChange({ ...value, lineItems });
  };

  const addLineItem = () => {
    const newItem: LineItem = {
      id: crypto.randomUUID(),
      description: "",
      amount: ""
    };
    onChange({ ...value, lineItems: [...value.lineItems, newItem] });
  };

  const removeLineItem = (id: string) => {
    const lineItems = value.lineItems.filter((item) => item.id !== id);
    onChange({ ...value, lineItems });
  };

  const onLogoSelected: React.ChangeEventHandler<HTMLInputElement> = (
    e
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      onChange({ ...value, logoDataUrl: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  const computedTotal = value.lineItems.reduce((sum, item) => {
    const n = parseFloat(item.amount);
    if (!isNaN(n)) return sum + n;
    return sum;
  }, 0);

  return (
    <div className="space-y-6">
      <section className="space-y-2 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold">Branding</h2>
        <div className="space-y-3">
          <div>
            <Label htmlFor="logo">Logo (PNG/JPEG)</Label>
            <Input id="logo" type="file" accept="image/*" onChange={onLogoSelected} />
          </div>
          <div>
            <Label htmlFor="fromCompanyName">From company</Label>
            <Input
              id="fromCompanyName"
              value={value.fromCompanyName}
              onChange={(e) =>
                handleFieldChange("fromCompanyName", e.target.value)
              }
            />
          </div>
          <div>
            <Label htmlFor="fromCompanyAddress">From address</Label>
            <Textarea
              id="fromCompanyAddress"
              rows={2}
              value={value.fromCompanyAddress}
              onChange={(e) =>
                handleFieldChange("fromCompanyAddress", e.target.value)
              }
            />
          </div>
        </div>
      </section>

      <section className="space-y-2 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold">Invoice details</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="invoiceTo">Invoice to (label)</Label>
            <Input
              id="invoiceTo"
              value={value.invoiceTo}
              onChange={(e) =>
                handleFieldChange("invoiceTo", e.target.value)
              }
            />
          </div>
          <div>
            <Label htmlFor="invoiceToCompany">Client name</Label>
            <Input
              id="invoiceToCompany"
              value={value.invoiceToCompany}
              onChange={(e) =>
                handleFieldChange("invoiceToCompany", e.target.value)
              }
            />
          </div>
          <div className="col-span-2">
            <Label htmlFor="invoiceToAddress">Client address</Label>
            <Textarea
              id="invoiceToAddress"
              rows={2}
              value={value.invoiceToAddress}
              onChange={(e) =>
                handleFieldChange("invoiceToAddress", e.target.value)
              }
            />
          </div>
          <div>
            <Label htmlFor="invoiceNumber">Invoice #</Label>
            <Input
              id="invoiceNumber"
              value={value.invoiceNumber}
              onChange={(e) =>
                handleFieldChange("invoiceNumber", e.target.value)
              }
            />
          </div>
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={value.date}
              onChange={(e) => handleFieldChange("date", e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={value.subject}
              onChange={(e) =>
                handleFieldChange("subject", e.target.value)
              }
            />
          </div>
        </div>
      </section>

      <section className="space-y-2 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Line items</h2>
          <Button type="button" onClick={addLineItem} className="h-7 px-2 text-[11px]">
            + Add item
          </Button>
        </div>
        <div className="space-y-3">
          {value.lineItems.map((item, index) => (
            <div
              key={item.id}
              className="grid grid-cols-[minmax(0,1fr)_90px_32px] items-start gap-2"
            >
              <div>
                <Label>Item {index + 1}</Label>
                <Textarea
                  rows={2}
                  value={item.description}
                  onChange={(e) =>
                    handleLineItemChange(
                      item.id,
                      "description",
                      e.target.value
                    )
                  }
                />
              </div>
              <div>
                <Label>Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={item.amount}
                  onChange={(e) =>
                    handleLineItemChange(item.id, "amount", e.target.value)
                  }
                />
              </div>
              <div className="mt-5">
                <Button
                  type="button"
                  className="h-7 w-full border-slate-300 bg-white text-[11px] text-slate-700 hover:bg-slate-50"
                  onClick={() => removeLineItem(item.id)}
                >
                  ✕
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 border-t border-dashed border-slate-200 pt-3 text-xs">
          <div>
            <Label htmlFor="currency">Currency label</Label>
            <Input
              id="currency"
              value={value.currency}
              onChange={(e) =>
                handleFieldChange("currency", e.target.value)
              }
            />
          </div>
          <div>
            <Label htmlFor="overrideTotal">
              Override total (optional)
            </Label>
            <Input
              id="overrideTotal"
              placeholder={computedTotal.toFixed(2)}
              value={value.overrideTotal ?? ""}
              onChange={(e) =>
                handleFieldChange("overrideTotal", e.target.value)
              }
            />
            <p className="mt-1 text-[10px] text-slate-500">
              If empty, total will be calculated from line items:{" "}
              {computedTotal.toFixed(2)}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-2 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold">Payment / signature</h2>
        <div className="space-y-3">
          <div>
            <Label htmlFor="footerNote">Footer note</Label>
            <Textarea
              id="footerNote"
              rows={2}
              value={value.footerNote}
              onChange={(e) =>
                handleFieldChange("footerNote", e.target.value)
              }
            />
          </div>
          <div>
            <Label htmlFor="signatureLabel">Signature label</Label>
            <Input
              id="signatureLabel"
              value={value.signatureLabel}
              onChange={(e) =>
                handleFieldChange("signatureLabel", e.target.value)
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="bankCompanyName">Bank company name</Label>
              <Input
                id="bankCompanyName"
                value={value.bankDetails.companyName}
                onChange={(e) =>
                  onChange({
                    ...value,
                    bankDetails: {
                      ...value.bankDetails,
                      companyName: e.target.value
                    }
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="bankName">Bank name</Label>
              <Input
                id="bankName"
                value={value.bankDetails.bankName}
                onChange={(e) =>
                  onChange({
                    ...value,
                    bankDetails: {
                      ...value.bankDetails,
                      bankName: e.target.value
                    }
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="bankLabel">Bank label</Label>
              <Input
                id="bankLabel"
                value={value.bankDetails.bankLabel}
                onChange={(e) =>
                  onChange({
                    ...value,
                    bankDetails: {
                      ...value.bankDetails,
                      bankLabel: e.target.value
                    }
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="iban">Account IBAN</Label>
              <Input
                id="iban"
                value={value.bankDetails.accountIban}
                onChange={(e) =>
                  onChange({
                    ...value,
                    bankDetails: {
                      ...value.bankDetails,
                      accountIban: e.target.value
                    }
                  })
                }
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="accountNumber">Account number</Label>
              <Input
                id="accountNumber"
                value={value.bankDetails.accountNumber}
                onChange={(e) =>
                  onChange({
                    ...value,
                    bankDetails: {
                      ...value.bankDetails,
                      accountNumber: e.target.value
                    }
                  })
                }
              />
            </div>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <Button type="button" onClick={onDownloadPdf}>
          Download PDF
        </Button>
      </div>
    </div>
  );
};
