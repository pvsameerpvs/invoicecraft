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
      amount: "",
    };
    onChange({ ...value, lineItems: [...value.lineItems, newItem] });
  };

  const addPresetLineItem = (preset: { label: string; amount: string }) => {
    const newItem: LineItem = {
      id: crypto.randomUUID(),
      description: preset.label,
      amount: preset.amount,
    };
    onChange({ ...value, lineItems: [...value.lineItems, newItem] });
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
    const n = parseFloat(item.amount);
    if (!isNaN(n)) return sum + n;
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
  {/* <Button
    type="button"
    onClick={() => window.location.assign("/history")}
    className="h-10 rounded-xl bg-white px-4 text-sm font-medium text-brand-primary shadow-sm ring-1 ring-orange-200 hover:bg-orange-50"
  >
    History
  </Button> */}

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
        </div>
      </section>

      <section className="space-y-2 rounded-lg border border-brand-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold">Invoice details</h2>
        <div className="grid grid-cols-2 gap-3">
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
              className="whitespace-pre-wrap break-words"
              onChange={(e) =>
                handleFieldChange("invoiceToAddress", e.target.value)
              }
            />
          </div>

          <div>
            <Label htmlFor="invoiceNumber">Invoice # (Auto)</Label>
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

          <div className="col-span-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={value.subject}
              onChange={(e) => handleFieldChange("subject", e.target.value)}
            />
          </div>

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

        {presets.map((p) => (
          <option key={p.label} value={p.label}>
            {p.label}
            {p.amount && p.amount.trim().length > 0 ? ` - ${p.amount}` : ""}
          </option>
        ))}

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

  {/* ✅ Each item is a card + inputs in column */}
  <div className="space-y-3">
    {value.lineItems.map((item, index) => (
      <div
        key={item.id}
        className="rounded-xl border border-brand-200 bg-white p-3 shadow-md shadow-brand-100"
      >
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">
            Item {index + 1}
          </p>
          <Button
            type="button"
            className="h-8 px-3 border-brand-200 bg-white text-xs text-red-500 hover:bg-red-50"
            onClick={() => removeLineItem(item.id)}
          >
            ✕ Remove
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <Label>Description</Label>
            <Textarea
              rows={3}
              value={item.description}
              onChange={(e) =>
                handleLineItemChange(item.id, "description", e.target.value)
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
      <p className="mt-1 text-[10px] text-slate-500">
        Live total: <span className="font-semibold">{liveTotalText}</span>
      </p>
    </div>
  </div>
</section>

      <section className="space-y-2 rounded-lg border border-brand-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold">Payment / signature</h2>

        <div className="space-y-3">
          <div>
            <Label htmlFor="footerNote">Footer note</Label>
            <Textarea
              id="footerNote"
              rows={2}
              value={value.footerNote}
              disabled={lockedDisabled}
              className="disabled:opacity-70"
              onChange={(e) => handleFieldChange("footerNote", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="signatureLabel">Signature label</Label>
            <Input
              id="signatureLabel"
              value={value.signatureLabel}
              disabled={lockedDisabled}
              className="disabled:opacity-70"
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

      <div className="flex justify-end">
        <Button type="button" onClick={onDownloadPdf} className="bg-gradient-to-r from-brand-start to-brand-end hover:shadow-lg hover:shadow-brand-primary/30 transition-all">
          {isUpdate ? "Edit & Download PDF" : "Download PDF"}
        </Button>
      </div>
    </div>
  );
};
