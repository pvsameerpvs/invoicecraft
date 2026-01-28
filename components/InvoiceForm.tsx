"use client";

import { InvoiceData, LineItem } from "../lib/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import React from "react";
import { ClientSelect } from "./ClientSelect";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

interface InvoiceFormProps {
  value: InvoiceData;
  onChange: (next: InvoiceData) => void;
  onDownloadPdf: () => void;
  isUpdate?: boolean;
}



export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  value,
  onChange,
  onDownloadPdf,
  isUpdate = false,
}) => {
  const [isEditingLockedFields, setIsEditingLockedFields] =
    React.useState(false);

  const [isAddItemPickerOpen, setIsAddItemPickerOpen] = React.useState(false);

  const [presets, setPresets] = React.useState<Array<{ label: string; amount: string }>>([]);

  React.useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPresets(data);
        }
      })
      .catch((err) => console.error("Failed to load products preset", err));
  }, []);

  const handleFieldChange = (field: keyof InvoiceData, newValue: string) => {
    onChange({ ...value, [field]: newValue });
  };

  const handleLineItemChange = (
    id: string,
    field: keyof LineItem,
    newValue: string | number
  ) => {
    const lineItems = value.lineItems.map((item) => {
      if (item.id === id) {
        let val = newValue;
        if (field === "quantity" && typeof newValue === "string") {
          val = parseInt(newValue) || 1;
        }
        return { ...item, [field]: val };
      }
      return item;
    });
    onChange({ ...value, lineItems });
  };

  const addLineItem = () => {
    const newItem: LineItem = {
      id: crypto.randomUUID(),
      description: "",
      unitPrice: "",
      quantity: 1,
    };
    onChange({ ...value, lineItems: [newItem, ...value.lineItems] });
  };

  const addPresetLineItem = (preset: { label: string; amount: string }) => {
    const newItem: LineItem = {
      id: crypto.randomUUID(),
      description: preset.label,
      unitPrice: preset.amount,
      quantity: 1,
    };
    onChange({ ...value, lineItems: [newItem, ...value.lineItems] });
  };

  const removeLineItem = (id: string) => {
    const lineItems = value.lineItems.filter((item) => item.id !== id);
    onChange({ ...value, lineItems });
  };

  const onLogoSelected: React.ChangeEventHandler<HTMLInputElement> = (e) => {
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
    const price = parseFloat(item.unitPrice);
    const qty = item.quantity || 1;
    if (!isNaN(price)) return sum + (price * qty);
    return sum;
  }, 0);

  const lockedDisabled = !isEditingLockedFields;

  const liveTotalText =
    value.overrideTotal && value.overrideTotal.trim().length > 0
      ? value.overrideTotal
      : computedTotal.toFixed(2);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => handleFieldChange("documentType", "Invoice")}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${value.documentType === "Invoice" || !value.documentType ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Invoice
          </button>
          <button
            type="button"
            onClick={() => handleFieldChange("documentType", "Quotation")}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${value.documentType === "Quotation" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Quotation
          </button>
        </div>

        <Button
          type="button"
          onClick={() => setIsEditingLockedFields((v) => !v)}
          className="h-10 rounded-xl bg-white px-4 text-sm font-medium text-brand-primary shadow-sm ring-1 ring-brand-200 hover:bg-brand-50"
        >
          {isEditingLockedFields ? "Lock fields" : "Edit locked fields"}
        </Button>
      </div>


      <section className="space-y-2 rounded-lg border border-brand-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold">Branding</h2>
        <div className="space-y-3">
          <div>
            <Label htmlFor="logo">Logo (PNG/JPEG)</Label>
            <Input
              id="logo"
              type="file"
              accept="image/*"
              onChange={onLogoSelected}
              disabled={lockedDisabled}
            />
          </div>

          <div>
            <Label htmlFor="fromCompanyName">From company</Label>
            <Input
              id="fromCompanyName"
              value={value.fromCompanyName}
              disabled={lockedDisabled}
              className="disabled:opacity-70"
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
              disabled={lockedDisabled}
              className="disabled:opacity-70"
              onChange={(e) =>
                handleFieldChange("fromCompanyAddress", e.target.value)
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="fromCompanyTrn">TRN / Tax ID</Label>
              <Input
                id="fromCompanyTrn"
                value={value.fromCompanyTrn || ""}
                disabled={lockedDisabled}
                className="disabled:opacity-70"
                onChange={(e) => handleFieldChange("fromCompanyTrn", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="fromCompanyEmail">Company Email</Label>
              <Input
                id="fromCompanyEmail"
                value={value.fromCompanyEmail || ""}
                disabled={lockedDisabled}
                className="disabled:opacity-70"
                onChange={(e) => handleFieldChange("fromCompanyEmail", e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="fromCompanyPhone">Company Phone</Label>
              <Input
                id="fromCompanyPhone"
                value={value.fromCompanyPhone || ""}
                disabled={lockedDisabled}
                className="disabled:opacity-70"
                onChange={(e) => handleFieldChange("fromCompanyPhone", e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-2 rounded-lg border border-brand-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-brand-primary">{value.documentType === "Quotation" ? "Quotation details" : "Invoice details"}</h2>
        <div className="grid grid-cols-2 gap-3">
          {value.documentType !== "Quotation" && (
            <div>
              <Label htmlFor="invoiceTo">Invoice to (label)</Label>
              <Input
                id="invoiceTo"
                value={value.invoiceTo}
                disabled={lockedDisabled}
                className="disabled:opacity-70"
                onChange={(e) => handleFieldChange("invoiceTo", e.target.value)}
              />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="invoiceToCompany">Client name</Label>
              {value.invoiceToCompany && (
                <Link 
                  href={`/clients/${encodeURIComponent(value.invoiceToCompany)}`}
                  className="flex items-center gap-1 text-[10px] font-bold text-brand-primary hover:underline transition-all"
                  target="_blank"
                >
                  View Profile
                  <ExternalLink className="w-2.5 h-2.5" />
                </Link>
              )}
            </div>
            <ClientSelect
              value={value.invoiceToCompany}
              placeholder={value.documentType === "Quotation" ? "Enter potential client name" : "Enter client name"}
              onChange={(name, address, email, phone) => {
                const next = { ...value, invoiceToCompany: name };
                if (address) next.invoiceToAddress = address;
                if (email) next.invoiceToEmail = email;
                if (phone) next.invoiceToPhone = phone;
                onChange(next);
              }}
            />
          </div>

          <div>
            <Label htmlFor="invoiceToEmail">Client email</Label>
            <Input
              id="invoiceToEmail"
              placeholder="client@example.com"
              value={value.invoiceToEmail || ""}
              onChange={(e) => handleFieldChange("invoiceToEmail", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="invoiceToPhone">Client phone</Label>
            <Input
              id="invoiceToPhone"
              placeholder="+971 50 000 0000"
              value={value.invoiceToPhone || ""}
              onChange={(e) => handleFieldChange("invoiceToPhone", e.target.value)}
            />
          </div>

          <div className="col-span-2">
            <Label htmlFor="invoiceToAddress">Client address</Label>
            <Textarea
              id="invoiceToAddress"
              rows={2}
              value={value.invoiceToAddress}
              className="whitespace-pre-wrap break-words"
              onChange={(e) =>
                handleFieldChange("invoiceToAddress", e.target.value)
              }
            />
          </div>

          <div>
            <Label htmlFor="invoiceNumber">{value.documentType === "Quotation" ? "Quotation # (Auto)" : "Invoice # (Auto)"}</Label>
            <Input
              id="invoiceNumber"
              value={value.invoiceNumber}
              disabled
              className="bg-slate-100/50 text-slate-500 cursor-not-allowed opacity-100" // opacity-100 to ensure readability
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

          {value.documentType === "Quotation" && (
            <div>
              <Label htmlFor="validityDate">Validity Date</Label>
              <Input
                id="validityDate"
                type="date"
                value={value.validityDate || ""}
                onChange={(e) => handleFieldChange("validityDate", e.target.value)}
              />
            </div>
          )}

          <div className={value.documentType === "Quotation" ? "col-span-1" : "col-span-2"}>
            <Label htmlFor="subject">{value.documentType === "Quotation" ? "Subject / Project" : "Subject"}</Label>
            <Input
              id="subject"
              value={value.subject}
              placeholder={value.documentType === "Quotation" ? "e.g. Website Development" : ""}
              onChange={(e) => handleFieldChange("subject", e.target.value)}
            />
          </div>

          {value.documentType !== "Quotation" && (
            <div>
               <Label htmlFor="status">Status</Label>
               <select
                  id="status"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-brand-200"
                  value={value.status || "Unpaid"}
                  onChange={(e) => handleFieldChange("status", e.target.value)}
               >
                  <option value="Unpaid">Unpaid</option>
                  <option value="Paid">Paid</option>
               </select>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-2 rounded-lg border border-brand-200 bg-white p-4 shadow-sm">
  <div className="flex items-center justify-between">
    <h2 className="text-sm font-semibold">Line items</h2>

    <div className="flex items-center gap-2">
      <Button
        type="button"
        onClick={() => setIsAddItemPickerOpen((v) => !v)}
        className="h-7 px-2 text-[11px] bg-brand-primary hover:bg-brand-end text-white"
      >
        + Add item
      </Button>
    </div>
  </div>

  {isAddItemPickerOpen && (
    <div className="mt-2 grid grid-cols-1 gap-2 rounded-lg border border-brand-200 bg-brand-50 p-3">
      <Label>Select an item</Label>
      <select
        className="h-10 w-full rounded-md border border-brand-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-brand-primary/50"
        defaultValue=""
        onChange={(e) => {
          const v = e.target.value;
          if (!v) return;

          if (v === "__custom__") {
            addLineItem();
            setIsAddItemPickerOpen(false);
            e.currentTarget.value = "";
            return;
          }

          const preset = presets.find((p) => p.label === v);
          if (preset) {
            addPresetLineItem(preset);
            setIsAddItemPickerOpen(false);
            e.currentTarget.value = "";
          }
        }}
      >
        <option value="" disabled>
          Choose…
        </option>

        {presets.map((p) => {
          const isAtLeastOneAlreadyAdded = value.lineItems.some(
            (item) => item.description === p.label
          );
          return (
            <option key={p.label} value={p.label} disabled={isAtLeastOneAlreadyAdded}>
              {p.label}
              {p.amount && p.amount.trim().length > 0 ? ` - ${p.amount}` : ""}
              {isAtLeastOneAlreadyAdded ? " (Already added)" : ""}
            </option>
          );
        })}

        <option value="__custom__">Custom item…</option>
      </select>


      <div className="flex justify-end">
        <Button
          type="button"
          className="h-8 px-3 text-[11px] border-brand-200 bg-white text-brand-700 hover:bg-brand-50"
          onClick={() => setIsAddItemPickerOpen(false)}
        >
          Close
        </Button>
      </div>
    </div>
  )}

  {/* ✅ Enhanced Line Items UI */}
  <div className="space-y-4">
    {value.lineItems.map((item, index) => (
      <div
        key={item.id}
        className="group relative rounded-2xl border border-brand-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-brand-primary/30"
      >
        <div className="absolute -left-2 -top-2 flex h-6 w-10 items-center justify-center rounded-full bg-brand-primary text-[10px] font-bold text-white shadow-sm">
           #{value.lineItems.length - index}
        </div>

        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Invoice Detail
          </h3>
          <Button
            type="button"
            variant="ghost"
            className="h-8 px-3 text-[11px] font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
            onClick={() => removeLineItem(item.id)}
          >
            ✕ Remove Item
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase text-slate-500 ml-1">Description</Label>
            <Textarea
              rows={2}
              placeholder="What are you charging for?"
              className="resize-none rounded-xl border-slate-200 focus:border-brand-primary focus:ring-brand-primary"
              value={item.description}
              onChange={(e) =>
                handleLineItemChange(item.id, "description", e.target.value)
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase text-slate-500 ml-1">Quantity</Label>
              <div className="flex items-center gap-1 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/30 p-1 focus-within:border-brand-primary focus-within:ring-1 focus-within:ring-brand-primary transition-all">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 w-8 rounded-lg text-slate-400 hover:text-brand-primary hover:bg-white"
                  onClick={() => {
                    const newQty = Math.max(1, (item.quantity || 1) - 1);
                    handleLineItemChange(item.id, "quantity", newQty.toString());
                  }}
                >
                  -
                </Button>
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    handleLineItemChange(item.id, "quantity", (isNaN(val) ? 1 : val).toString());
                  }}
                  className="h-8 border-none bg-transparent p-0 text-center text-sm font-bold text-slate-700 shadow-none focus:ring-0"
                />
                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 w-8 rounded-lg text-slate-400 hover:text-brand-primary hover:bg-white"
                  onClick={() => {
                    const newQty = (item.quantity || 1) + 1;
                    handleLineItemChange(item.id, "quantity", newQty.toString());
                  }}
                >
                  +
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase text-slate-500 ml-1">Unit Price</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 uppercase">{value.currency}</span>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="h-10 rounded-xl border-slate-200 pl-10 text-sm font-bold text-slate-700 focus:border-brand-primary focus:ring-brand-primary"
                  value={item.unitPrice}
                  onChange={(e) =>
                    handleLineItemChange(item.id, "unitPrice", e.target.value)
                  }
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
             <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Extended Price</span>
             <span className="text-sm font-bold text-brand-primary">
                {value.currency} {(parseFloat(item.unitPrice || "0") * (item.quantity || 1)).toFixed(2)}
             </span>
          </div>
        </div>
      </div>
    ))}
  </div>

  <div className="mt-3 grid grid-cols-1 gap-3 border-t border-dashed border-brand-200 pt-3 text-xs sm:grid-cols-2">
    <div>
      <Label htmlFor="currency">Currency label</Label>
      <Input
        id="currency"
        value={value.currency}
        onChange={(e) => handleFieldChange("currency", e.target.value)}
        disabled={lockedDisabled}
      />
    </div>

    <div>
      <Label htmlFor="overrideTotal">Override total (optional)</Label>
      <Input
        id="overrideTotal"
        placeholder={computedTotal.toFixed(2)}
        value={value.overrideTotal ?? ""}
        disabled={lockedDisabled}
        onChange={(e) => handleFieldChange("overrideTotal", e.target.value)}
      />
    </div>

    <div>
      <Label htmlFor="discount">Discount (optional)</Label>
      <Input
        id="discount"
        placeholder="0.00"
        value={value.discount ?? ""}
        onChange={(e) => handleFieldChange("discount", e.target.value)}
      />
      <p className="mt-1 text-[10px] text-slate-500">
        Live total: <span className="font-semibold">{liveTotalText}</span>
      </p>
    </div>
  </div>
</section>

      {value.documentType !== "Quotation" ? (
        <section className="space-y-4 rounded-lg border border-brand-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-brand-primary">Payment / Signature</h2>

          <div className="space-y-3">
            <div>
              <Label htmlFor="footerNote">Terms & Conditions</Label>
              <Textarea
                id="footerNote"
                rows={4}
                value={value.footerNote}
                disabled={lockedDisabled}
                className="disabled:opacity-70"
                onChange={(e) => handleFieldChange("footerNote", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="signatureLabel">Signature Label</Label>
              <Input
                id="signatureLabel"
                value={value.signatureLabel}
                disabled={lockedDisabled}
                className="disabled:opacity-70"
                onChange={(e) => handleFieldChange("signatureLabel", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="bankCompanyName">Bank company name</Label>
                <Input
                  id="bankCompanyName"
                  value={value.bankDetails.companyName}
                  disabled={lockedDisabled}
                  className="disabled:opacity-70"
                  onChange={(e) =>
                    onChange({
                      ...value,
                      bankDetails: {
                        ...value.bankDetails,
                        companyName: e.target.value,
                      },
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="bankName">Bank name</Label>
                <Input
                  id="bankName"
                  value={value.bankDetails.bankName}
                  disabled={lockedDisabled}
                  className="disabled:opacity-70"
                  onChange={(e) =>
                    onChange({
                      ...value,
                      bankDetails: {
                        ...value.bankDetails,
                        bankName: e.target.value,
                      },
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="bankLabel">Bank label</Label>
                <Input
                  id="bankLabel"
                  value={value.bankDetails.bankLabel}
                  disabled={lockedDisabled}
                  className="disabled:opacity-70"
                  onChange={(e) =>
                    onChange({
                      ...value,
                      bankDetails: {
                        ...value.bankDetails,
                        bankLabel: e.target.value,
                      },
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="iban">Account IBAN</Label>
                <Input
                  id="iban"
                  value={value.bankDetails.accountIban}
                  disabled={lockedDisabled}
                  className="disabled:opacity-70"
                  onChange={(e) =>
                    onChange({
                      ...value,
                      bankDetails: {
                        ...value.bankDetails,
                        accountIban: e.target.value,
                      },
                    })
                  }
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="accountNumber">Account number</Label>
                <Input
                  id="accountNumber"
                  value={value.bankDetails.accountNumber}
                  disabled={lockedDisabled}
                  className="disabled:opacity-70"
                  onChange={(e) =>
                    onChange({
                      ...value,
                      bankDetails: {
                        ...value.bankDetails,
                        accountNumber: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="space-y-4 rounded-lg border border-brand-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-brand-primary">Quotation Footer</h2>
            <div>
              <Label htmlFor="footerNote">Terms & Conditions</Label>
              <Textarea
                id="footerNote"
                rows={6}
                value={value.footerNote}
                placeholder="List your quotation validity, payment terms, etc."
                className="resize-none"
                onChange={(e) => handleFieldChange("footerNote", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="signatureLabel">Authorized Signature Label</Label>
              <Input
                id="signatureLabel"
                value={value.signatureLabel || "Authorized Signature"}
                onChange={(e) => handleFieldChange("signatureLabel", e.target.value)}
              />
            </div>
         </section>
      )}

      <div className="flex justify-end pt-4">
        <Button 
          type="button" 
          onClick={onDownloadPdf} 
          className="bg-gradient-to-r from-brand-start to-brand-end hover:shadow-lg hover:shadow-brand-primary/30 transition-all font-bold px-8 py-6 rounded-xl text-lg"
        >
          {isUpdate ? "Update & Download PDF" : "Save & Download PDF"}
        </Button>
      </div>
    </div>
  );
};
