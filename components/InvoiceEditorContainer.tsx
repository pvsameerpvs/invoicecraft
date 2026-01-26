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
import { useRouter } from "next/navigation";
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
};

interface Props {
  initialInvoiceId?: string;
}

export function InvoiceEditorContainer({ initialInvoiceId }: Props) {
  const [invoice, setInvoice] = useState<InvoiceData>(initialInvoiceData);
  const [loading, setLoading] = useState(true);
  const previewRef = useRef<HTMLDivElement | null>(null);

  const router = useRouter();
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
                const res = await fetch("/api/invoice-history");
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

            // 2. If NEW invoice (only if NOT loaded and NO ID provided)
             try {
                if (!loaded && !initialInvoiceId) {
                    // Apply database defaults + base structure
                    setInvoice(prev => ({
                        ...prev, 
                        ...settingsDefaults,
                        invoiceNumber: "Loading..."
                    }));
                    
                    const res = await fetch("/api/invoice-history");
                    const history = await res.json();
                    
                    const currentYear = new Date().getFullYear();
                    let nextNum = `INV-${currentYear}-000001`; 
                    
                    if (Array.isArray(history) && history.length > 0) {
                      const latest = history[0]; 
                      const matchNew = (latest.invoiceNumber || "").match(/INV-(\d{4})-(\d+)/);
                      
                      if (matchNew) {
                          const lastYear = parseInt(matchNew[1], 10);
                          const lastSeq = parseInt(matchNew[2], 10);
                          
                          if (lastYear === currentYear) {
                              const nextSeq = lastSeq + 1;
                              nextNum = `INV-${currentYear}-${String(nextSeq).padStart(6, "0")}`;
                          } else {
                              nextNum = `INV-${currentYear}-000001`;
                          }
                      } else {
                          // Fallback
                           nextNum = `INV-${currentYear}-000001`;
                      }
                    }
                    setInvoice(prev => ({...prev, invoiceNumber: nextNum}));
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

   const handleDownload = async () => {
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

      {/* MOBILE TABS CONTROL (Sticky Top) */}
      <div className="lg:hidden sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-2">
         <div className="flex p-1 bg-slate-100 rounded-lg">
             <button
               onClick={() => setMobileTab("edit")}
               className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-all ${mobileTab === "edit" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
             >
               {isUpdateMode ? "Edit Invoice" : "Create Invoice"}
             </button>
             <button
                onClick={() => setMobileTab("preview")}
               className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-all ${mobileTab === "preview" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
             >
               {isUpdateMode ? "Preview & Download" : "Preview & Create"}
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
                <h2 className="text-lg font-semibold text-slate-900">Invoice Details</h2>
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
                    <span>{isUpdateMode ? "Update & Download PDF" : "Save & Download PDF"}</span>
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
