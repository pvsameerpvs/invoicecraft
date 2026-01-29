"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { InvoiceForm } from "./InvoiceForm";
import { InvoicePreview } from "./InvoicePreview";
import { UserMenu } from "./UserMenu";
import { InvoiceData } from "../lib/types";
import { downloadInvoicePdf } from "../lib/pdf";
import toast from "react-hot-toast";
import { History, PlusCircle, ChevronLeft, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PremiumLoader } from "./ui/premium-loader";
import { useUnsavedChanges } from "./providers/UnsavedChangesContext";

const initialInvoiceData: InvoiceData = {
  logoDataUrl: undefined,
  invoiceTo: "INVOICE TO:",
  invoiceToCompany: "",
  invoiceToAddress: "",
  invoiceNumber: "",
  subject: "",
  date: new Date().toISOString().slice(0, 10),
  fromCompanyName: "", // Fetched from DB
  fromCompanyAddress: "", // Fetched from DB
  fromCompanyTrn: "", // Fetched from DB
  fromCompanyEmail: "", // Fetched from DB
  fromCompanyPhone: "", // Fetched from DB
  lineItems: [],
  currency: "AED",
  overrideTotal: "",
  footerNote: "", // Fetched from DB
  bankDetails: {
    companyName: "",
    bankName: "",
    bankLabel: "Bank",
    accountIban: "",
    accountNumber: "",
  },
  signatureLabel: "", // Fetched from DB
  status: "Unpaid",
  documentType: "Invoice",
};

interface Props {
  initialInvoiceId?: string;
}

export function InvoiceEditorContainer({ initialInvoiceId }: Props) {
  const [invoice, setInvoice] = useState<InvoiceData>(initialInvoiceData);
  const [loading, setLoading] = useState(true);
  const previewRef = useRef<HTMLDivElement | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { isDirty, setIsDirty, checkUnsavedChanges } = useUnsavedChanges();

  // Reset dirty state on mount/unmount
  useEffect(() => {
     setIsDirty(false);
     return () => setIsDirty(false);
  }, []);

  // Protect against refresh/close tab
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = ""; 
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const handleBackClick = (e: React.MouseEvent) => {
      e.preventDefault();
      checkUnsavedChanges(() => router.push("/dashboard"));
  };

  const handleInvoiceChange = (newData: InvoiceData | ((prev: InvoiceData) => InvoiceData)) => {
      setInvoice(newData);
      setIsDirty(true);
  };


  /* New State for tabs */
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");
  const [originalInvoiceNumber, setOriginalInvoiceNumber] = useState<string | null>(null);

  // ✅ Load invoice for editing (from URL ID) or Generate New
  useEffect(() => {
    const init = async () => {
        try {
            let loaded = false;
            let settingsDefaults: Partial<InvoiceData> = {};

            // 0. Fetch Settings from DB
            try {
                const settingsRes = await fetch("/api/settings");
                const settingsData = await settingsRes.json();
                
                if (settingsData && !settingsData.error) {
                    settingsDefaults = {
                        fromCompanyName: settingsData.CompanyName,
                        fromCompanyAddress: settingsData.CompanyAddress,
                        fromCompanyTrn: settingsData.CompanyTrn,
                        footerNote: settingsData.FooterNote,
                        signatureLabel: settingsData.SignatureLabel,
                        currency: settingsData.Currency,
                        fromCompanyEmail: settingsData.CompanyEmail,
                        fromCompanyPhone: settingsData.CompanyPhone,
                        logoDataUrl: settingsData.LogoUrl, // Pre-fill Logo
                        bankDetails: {
                            companyName: settingsData.BankCompanyName,
                            bankName: settingsData.BankName,
                            bankLabel: settingsData.BankLabel,
                            accountNumber: settingsData.AccountNumber,
                            accountIban: settingsData.AccountIban,
                        }
                    };
                }
            } catch (e) {
                console.error("Failed to load settings", e);
            }

            // 1. If EDITING existing invoice (ID from Prop)
            if (initialInvoiceId) {
                const typeParam = searchParams.get("type") || "Invoice";
                const res = await fetch(`/api/invoice-history?type=${typeParam}`);
                const history = await res.json();
                
                if (Array.isArray(history)) {
                    // Try exact match or loose match
                    const found = history.find((inv: any) => 
                        inv.invoiceNumber === initialInvoiceId || 
                        inv.invoiceNumber?.trim() === initialInvoiceId.trim()
                    );

                    if (found) {
                        try {
                           const parsed = JSON.parse(found.payloadJson);
                           // Migrate old line items structure
                           if (parsed.lineItems && Array.isArray(parsed.lineItems)) {
                               parsed.lineItems = parsed.lineItems.map((item: any) => ({
                                   ...item,
                                   unitPrice: item.unitPrice ?? item.amount ?? "0",
                                   quantity: item.quantity ?? 1
                               }));
                           }
                           setInvoice({ ...initialInvoiceData, ...parsed });
                           setOriginalInvoiceNumber(found.invoiceNumber);
                           toast.success(`Editing ${found.invoiceNumber}`);
                           loaded = true;
                        } catch (e) {
                           console.error("Failed to parse invoice payload", e);
                           toast.error("Data corrupted for this invoice");
                        }
                    } else {
                        toast.error(`Invoice ${initialInvoiceId} not found`);
                    }
                }
            }

            // 1.5 Handle "Convert from Quotation"
            const convertFromId = searchParams.get("convertFrom");
            const clientNameFromQuery = searchParams.get("client");

            if (!loaded && !initialInvoiceId && convertFromId) {
                const res = await fetch(`/api/invoice-history?type=Quotation`);
                const history = await res.json();
                const source = history.find((h: any) => h.invoiceNumber === convertFromId);
                
                if (source) {
                     try {
                        const parsed = JSON.parse(source.payloadJson);
                        // 1. Fetch Next Invoice Number
                        const nextNumRes = await fetch(`/api/next-number?type=Invoice`);
                        const nextNumData = await nextNumRes.json();
                        const nextInvoiceNum = nextNumData.nextNumber || `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

                        setInvoice(prev => ({
                            ...initialInvoiceData,
                            ...settingsDefaults,
                            ...parsed,
                            invoiceNumber: nextInvoiceNum, 
                            documentType: "Invoice",
                            status: "Unpaid",
                            sourceQuotation: convertFromId,
                            invoiceToCompany: clientNameFromQuery || parsed.invoiceToCompany || "", // Prioritize URL param for identity
                            date: new Date().toISOString().slice(0, 10),
                            invoiceTo: "INVOICE TO:" // Restore default invoice label
                        }));
                        toast.success(`Converting ${convertFromId} to Invoice`);
                        loaded = true;
                     } catch (e) {
                         console.error("Failed to parse source quotation", e);
                     }
                }
            }

            // 2. If NEW invoice (only if NOT loaded and NO ID provided)
             try {
                if (!loaded && !initialInvoiceId) {
                    const typeFromQuery = searchParams.get("type") as "Invoice" | "Quotation";
                    const clientNameFromQuery = searchParams.get("client");

                    const defaultValidity = new Date();
                    defaultValidity.setDate(defaultValidity.getDate() + 30); // 30 days default

                    // Apply database defaults + base structure
                    setInvoice(prev => ({
                        ...prev, 
                        ...settingsDefaults,
                        documentType: typeFromQuery || "Invoice",
                        invoiceNumber: "Loading...",
                        invoiceToCompany: clientNameFromQuery || "",
                        validityDate: typeFromQuery === "Quotation" ? defaultValidity.toISOString().slice(0, 10) : undefined
                    }));
                    
                    const res = await fetch(`/api/invoice-history?type=${typeFromQuery || "Invoice"}`);
                    const history = await res.json();

                    // If client name is provided, try to find their last address from clients API
                    if (clientNameFromQuery) {
                        try {
                            const clientsRes = await fetch("/api/clients");
                            const clients = await clientsRes.json();
                            const client = clients.find((c: any) => c.name === clientNameFromQuery);
                            if (client) {
                                setInvoice(prev => ({
                                    ...prev,
                                    invoiceToAddress: client.address || "",
                                    invoiceToEmail: client.email || "",
                                    invoiceToPhone: client.phone || ""
                                }));
                            }
                        } catch (e) {
                            console.error("Failed to fetch client details", e);
                        }
                    }
                    
                    // 2. Fetch Next Unique Number from Server
                    const docType = typeFromQuery || "Invoice";
                    const currentYear = new Date().getFullYear();
                    try {
                        const nextNumRes = await fetch(`/api/next-number?type=${docType}`);
                        const nextNumData = await nextNumRes.json();
                        if (nextNumData.nextNumber) {
                            setInvoice(prev => ({...prev, invoiceNumber: nextNumData.nextNumber}));
                        } else {
                            // Fallback if API fails
                            setInvoice(prev => ({...prev, invoiceNumber: `${docType === "Quotation" ? "QTN" : "INV"}-${currentYear}-${Date.now().toString().slice(-6)}`}));
                        }
                    } catch (err) {
                        console.error("Failed to fetch next number", err);
                        setInvoice(prev => ({...prev, invoiceNumber: `ERROR-RETRY`}));
                    }
                } 

             } catch (err) {
                 console.error("Failed to fetch history", err);
                 if (!loaded && !initialInvoiceId) {
                     setInvoice(prev => ({...prev, invoiceNumber: `INV-${Date.now()}`}));
                 }
             }

        } catch {
             // ignore errors
        }
        finally {
            // Emulate a slight delay for the "premium" feel if it loads instantly
            setTimeout(() => setLoading(false), 800);
        }
    };

    init();
  }, [initialInvoiceId]);

  const validateInvoice = (data: InvoiceData) => {
    const errors: string[] = [];
    if (!data.invoiceToCompany?.trim()) errors.push("Client Name is required");
    if (!data.invoiceToAddress?.trim()) errors.push("Client Address is required");
    if (!data.invoiceToEmail?.trim()) errors.push("Client Email is required");
    if (!data.invoiceToPhone?.trim()) errors.push("Client Phone is required");
    if (!data.date) errors.push("Date is required");
    if (!data.subject?.trim()) errors.push("Subject/Project is required");
    
    if (data.documentType === "Quotation") {
        if (!data.validityDate) errors.push("Validity Date is required for quotations");
        if (!data.footerNote?.trim()) errors.push("Terms & Conditions (Quotation Footer) are required");
    }

    if (!data.lineItems || data.lineItems.length === 0) {
        errors.push("At least one line item is required");
    } else {
        data.lineItems.forEach((item, idx) => {
            const num = data.lineItems.length - idx;
            if (!item.description?.trim()) errors.push(`Description is required for Item #${num}`);
            if (!item.unitPrice || parseFloat(item.unitPrice) <= 0) errors.push(`Valid Unit Price is required for Item #${num}`);
            if (!item.quantity || item.quantity <= 0) errors.push(`Quantity must be at least 1 for Item #${num}`);
        });
    }

    return errors;
  };

  const handleDownload = async () => {
    // 1. Validate
    const errors = validateInvoice(invoice);
    if (errors.length > 0) {
        // Show the first error or a summary
        toast.error(errors[0], { duration: 4000 });
        return;
    }

    const t = toast.loading("Saving & Generating PDF…");
    const isUpdate = !!originalInvoiceNumber; 

    try {
      let res;
      
      if (isUpdate && originalInvoiceNumber) {
        // ✅ UPDATE existing invoice
         res = await fetch("/api/invoice-history", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            originalInvoiceNumber, 
            invoice,
            currentUser: localStorage.getItem("invoicecraft:username") || ""
          }),
        });
      } else {
        // ✅ CREATE new invoice
        res = await fetch("/api/invoice-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...invoice,
            createdBy: localStorage.getItem("invoicecraft:username") || "Unknown",
          }),
        });
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save invoice history");
      }

      if (!previewRef.current) throw new Error("Preview not ready");
      await downloadInvoicePdf(previewRef.current);

      toast.success("Downloaded successfully!", { id: t });
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to download", { id: t });
    }
  };

  const isUpdateMode = !!originalInvoiceNumber;

  return (
    <>
    {loading && <PremiumLoader />}
    <div className="flex h-full flex-col bg-transparent text-slate-900 relative">
      {/* 1. Header removed (global) */}

      <div className="lg:hidden sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-2">
         <div className="flex p-1 bg-slate-100 rounded-lg">
             <button
               onClick={() => setMobileTab("edit")}
               className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-all ${mobileTab === "edit" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
             >
               {isUpdateMode 
                 ? (invoice.documentType === "Quotation" ? "Edit Quotation" : "Edit Invoice") 
                 : (invoice.documentType === "Quotation" ? "Create Quotation" : "Create Invoice")}
             </button>
             <button
                onClick={() => setMobileTab("preview")}
               className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-all ${mobileTab === "preview" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
             >
               {isUpdateMode 
                 ? "Preview & Download" 
                 : (invoice.documentType === "Quotation" ? "Preview & Save Quotation" : "Preview & Save Invoice")}
             </button>
         </div>
      </div>

     
      {/* 2. Main Layout (Sidebar + Preview) */}
      <main className="flex flex-1 flex-col min-h-0 overflow-y-auto lg:overflow-hidden lg:flex-row">
        {/* Left Sidebar: Form */}
        <aside className={`w-full lg:w-[500px] flex-none flex flex-col border-r border-slate-200 bg-white/50 backdrop-blur-2xl z-10 ${mobileTab === "preview" ? "hidden lg:flex" : "flex"}`}>


           {/* Sticky Header */}
           <div className="flex-none p-4 sm:p-6 border-b border-slate-100 bg-white/40 backdrop-blur-md z-20 sticky top-0 lg:static">
              <button 
                onClick={handleBackClick}
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-brand-primary mb-4 transition-colors group"
              >
                  <div className="p-1 rounded-full bg-slate-100 group-hover:bg-brand-50 transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </div>
                  Back to Dashboard
              </button>
              
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                  {invoice.documentType === "Quotation" ? "Quotation Details" : "Invoice Details"}
                </h2>
                <div className="text-xs text-slate-500">Auto-saving...</div>
              </div>
           </div>
           
           {/* Scrollable Form Content */}
           <div className="p-4 sm:p-6 lg:flex-1 lg:overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300">
               <InvoiceForm
                  value={invoice}
                  onChange={handleInvoiceChange}
                  onDownloadPdf={handleDownload}
                  isUpdate={isUpdateMode}
                />
           </div>
        </aside>

        {/* Right Content: PDF Preview */}
        <section className={`invoice-preview-section flex flex-1 justify-center overflow-y-auto bg-transparent p-4 lg:p-12 ${mobileTab === "edit" ? "hidden lg:flex" : "flex"}`}>
            <div className="h-fit w-full flex flex-col items-center">
               <InvoicePreview value={invoice} forwardRef={previewRef} />
               
               {/* Mobile Download Button Context (only show in preview tab on mobile) */}
               <div className="lg:hidden fixed bottom-6 right-6 z-50">
                  <button 
                     onClick={handleDownload}
                     className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-xl shadow-slate-900/20 font-semibold active:scale-95 transition-all"
                  >
                    <span>
                       {isUpdateMode 
                        ? (invoice.documentType === "Quotation" ? "Update & Download Quotation" : "Update & Download Invoice") 
                        : (invoice.documentType === "Quotation" ? "Save & Download Quotation" : "Save & Download Invoice")}
                     </span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  </button>
               </div>
            </div>
        </section>
      </main>
    </div>

    </>
  );
}
