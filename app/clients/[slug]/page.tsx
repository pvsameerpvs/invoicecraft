"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Building2, 
  FileText, 
  History, 
  TrendingUp, 
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  Plus,
  Mail,
  Phone,
  FileCheck2,
  CircleDollarSign,
  Briefcase
} from "lucide-react";
import toast from "react-hot-toast";
import { HistoryRow } from "../../../components/history/HistoryRow";
import { InvoicePreview } from "../../../components/InvoicePreview";
import { downloadInvoicePdf } from "@/lib/pdf";
import { InvoiceData, InvoiceHistoryRow } from "@/lib/types";
import { Skeleton } from "../../../components/ui/skeleton";

export default function ClientDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const clientName = decodeURIComponent(slug);

  const [history, setHistory] = useState<InvoiceHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "invoices" | "quotations">("all");
  const [previewInvoice, setPreviewInvoice] = useState<InvoiceData | null>(null);
  const previewRef = React.useRef<HTMLDivElement>(null);
  const [currentUser, setCurrentUser] = useState("");
  const [currentRole, setCurrentRole] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<InvoiceHistoryRow | null>(null);

  const fetchClientHistory = useCallback(async () => {
    setLoading(true);
    try {
      const [invRes, qtnRes] = await Promise.all([
        fetch(`/api/invoice-history?type=Invoice&client=${encodeURIComponent(clientName)}`),
        fetch(`/api/invoice-history?type=Quotation&client=${encodeURIComponent(clientName)}`)
      ]);

      let combined: InvoiceHistoryRow[] = [];
      if (invRes.ok) combined = [...combined, ...(await invRes.json())];
      if (qtnRes.ok) combined = [...combined, ...(await qtnRes.json())];

      // Sort by createdAt desc
      combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setHistory(combined);
    } catch (error) {
      console.error("Failed to fetch client history", error);
      toast.error("Failed to load client data");
    } finally {
      setLoading(false);
    }
  }, [clientName]);

  useEffect(() => {
    setCurrentUser(localStorage.getItem("invoicecraft:username") || "");
    setCurrentRole(localStorage.getItem("invoicecraft:role") || "");
    fetchClientHistory();
  }, [fetchClientHistory]);

  const stats = React.useMemo(() => {
    const invoices = history.filter(h => h.documentType === "Invoice");
    const quotations = history.filter(h => h.documentType === "Quotation");
    const totalRevenue = invoices.reduce((sum, h) => sum + parseFloat(h.total.replace(/,/g, "")), 0);
    const pendingAmount = invoices
      .filter(h => h.status !== "Paid")
      .reduce((sum, h) => sum + parseFloat(h.total.replace(/,/g, "")), 0);
    const paidInvoices = invoices.filter(h => h.status === "Paid").length;
    
    const acceptedQuotations = quotations.filter(h => h.status === "Accepted" || h.status === "Paid").length;
    
    return {
      totalRevenue,
      pendingAmount,
      invoiceCount: invoices.length,
      quotationCount: quotations.length,
      acceptedQuotations,
      paidRatio: invoices.length ? (paidInvoices / invoices.length) * 100 : 0
    };
  }, [history]);

  const contactInfo = React.useMemo(() => {
    const latestWithEmail = history.find(h => {
       try {
         const p = JSON.parse(h.payloadJson);
         return p.invoiceToEmail;
       } catch { return false; }
    });
    const latestWithPhone = history.find(h => {
       try {
         const p = JSON.parse(h.payloadJson);
         return p.invoiceToPhone;
       } catch { return false; }
    });

    let email = "";
    let phone = "";

    try {
      if (latestWithEmail) email = JSON.parse(latestWithEmail.payloadJson).invoiceToEmail;
      if (latestWithPhone) phone = JSON.parse(latestWithPhone.payloadJson).invoiceToPhone;
    } catch {}

    return { email, phone };
  }, [history]);

  const filteredHistory = history.filter(item => {
    if (activeTab === "all") return true;
    if (activeTab === "invoices") return item.documentType === "Invoice";
    if (activeTab === "quotations") return item.documentType === "Quotation";
    return true;
  });

  const onPreview = (row: InvoiceHistoryRow) => {
    try {
      if (!row.payloadJson) return toast.error("Missing data");
      setPreviewInvoice(JSON.parse(row.payloadJson));
    } catch (e) {
      toast.error("Failed to load preview");
    }
  };

  const downloadPreview = async () => {
    if (!previewRef.current) return;
    const t = toast.loading("Generating PDF...");
    try {
      await downloadInvoicePdf(previewRef.current);
      toast.success("Downloaded", { id: t });
    } catch (e) {
      toast.error("Failed to download", { id: t });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-brand-100 selection:text-brand-900">
      {/* Project Theme Header (Orange/Gold Gradient) */}
      <div className="relative bg-gradient-to-br from-brand-start to-brand-end pt-12 pb-32 overflow-hidden shadow-2xl">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-black/5 mix-blend-overlay" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-black/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-8">
          <button 
            onClick={() => router.back()}
            className="group flex items-center gap-2 text-white/80 hover:text-white font-bold text-sm mb-10 transition-all"
          >
            <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-md group-hover:bg-white/40 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            Back to Directory
          </button>
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-[2.5rem] flex items-center justify-center p-0.5 border border-white/30 shadow-2xl">
                  <div className="w-full h-full bg-white rounded-[2.4rem] flex items-center justify-center">
                    <Building2 className="w-10 h-10 text-brand-primary" />
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full border-4 border-brand-end flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">{clientName}</h1>
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-white border border-white/20">
                    Trusted Partner
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-white/80 font-bold text-sm">
                   {contactInfo.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {contactInfo.phone}
                      </div>
                   )}
                   {contactInfo.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {contactInfo.email}
                      </div>
                   )}
                   {(!contactInfo.phone && !contactInfo.email) && (
                      <>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Partner since {history.length > 0 ? new Date(history[history.length-1].createdAt).getFullYear() : '2024'}
                        </div>
                        <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4" />
                          {history.length} Documents
                        </div>
                      </>
                   )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
               <button 
                 onClick={() => router.push(`/invoice?type=Quotation&client=${encodeURIComponent(clientName)}`)}
                 className="flex-1 lg:flex-none h-14 px-8 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-black border border-white/30 backdrop-blur-md transition-all active:scale-95 flex items-center justify-center gap-3"
               >
                 <FileCheck2 className="w-5 h-5" />
                 Create Proposal
               </button>
               <button 
                 onClick={() => router.push(`/invoice?type=Invoice&client=${encodeURIComponent(clientName)}`)}
                 className="flex-1 lg:flex-none h-14 px-8 rounded-2xl bg-white text-brand-primary font-black shadow-2xl hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-3"
               >
                 <Plus className="w-5 h-5" />
                 Generate Invoice
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content overlay */}
      <main className="max-w-7xl mx-auto px-4 -mt-16 sm:px-8 pb-24 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">
           {/* Stat Cards using Theme Colors */}
           <StatCard 
             label="Lifetime Billing" 
             value={stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
             currency="AED"
             icon={<CircleDollarSign className="w-6 h-6" />}
             bgColor="bg-brand-50"
             textColor="text-brand-primary"
             trend="+15%"
           />

           <StatCard 
             label="Pending Payment" 
             value={stats.pendingAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
             currency="AED"
             icon={<TrendingUp className="w-6 h-6" />}
             bgColor="bg-rose-50"
             textColor="text-rose-600"
           />

           <StatCard 
             label="Success Rate" 
             value={`${Math.round(stats.paidRatio)}%`}
             icon={<CheckCircle2 className="w-6 h-6" />}
             bgColor="bg-emerald-50"
             textColor="text-emerald-600"
             subValue={`${stats.invoiceCount} Invoices`}
             progress={stats.paidRatio}
           />

           <StatCard 
             label="Total Proposals" 
             value={stats.quotationCount.toString()}
             icon={<FileText className="w-6 h-6" />}
             bgColor="bg-slate-100"
             textColor="text-slate-600"
             subValue="Issued Proposals"
           />

           <StatCard 
             label="Accepted Proposals" 
             value={stats.acceptedQuotations.toString()}
             icon={<Briefcase className="w-6 h-6" />}
             bgColor="bg-emerald-100"
             textColor="text-emerald-700"
             subValue={`${stats.quotationCount > 0 ? (stats.acceptedQuotations / stats.quotationCount * 100).toFixed(0) : 0}% Conversion`}
           />
        </div>

        {/* Tab Selection Styled with Theme */}
        <div className="mb-8 flex items-center gap-2 p-1.5 bg-slate-200/50 rounded-2xl w-fit backdrop-blur-sm border border-slate-200">
           {[
             { id: 'all', label: 'Overview', icon: History },
             { id: 'invoices', label: 'Invoices', icon: TrendingUp },
             { id: 'quotations', label: 'Proposals', icon: FileText },
           ].map(tab => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
                 activeTab === tab.id 
                 ? "bg-white text-brand-primary shadow-lg border border-slate-100" 
                 : "text-slate-500 hover:text-slate-800"
               }`}
             >
               <tab.icon className="w-4 h-4" />
               {tab.label}
             </button>
           ))}
        </div>

        {/* Dynamic Table Card */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden ring-1 ring-black/5">
           <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse">
                 <thead>
                     <tr className="bg-slate-50/50 border-b border-slate-100">
                       <th className="w-16 px-6 py-5"></th>
                       <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Creation</th>
                       <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">User</th>
                       <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Document No.</th>
                       <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Doc Date</th>
                       <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Subject</th>
                       <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                       <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Cur</th>
                       <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Subtotal</th>
                       <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Tax</th>
                       <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right bg-slate-50/10 font-black">Final Amount</th>
                       <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                   {loading ? (
                     [...Array(5)].map((_, i) => (
                       <tr key={i}><td colSpan={12} className="px-8 py-6"><Skeleton className="h-10 w-full rounded-2xl" /></td></tr>
                     ))
                   ) : filteredHistory.length === 0 ? (
                     <tr>
                        <td colSpan={12} className="px-6 py-32 text-center">
                           <div className="max-w-xs mx-auto space-y-4">
                              <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto ring-1 ring-slate-100 text-slate-200">
                                 <FileText className="w-10 h-10" />
                              </div>
                              <div>
                                 <p className="font-black text-slate-900 text-lg">No history found</p>
                                 <p className="text-slate-400 font-bold text-sm">There are no matching documents for this partner.</p>
                              </div>
                           </div>
                        </td>
                     </tr>
                   ) : (
                     filteredHistory.map((row, idx) => (
                       <HistoryRow 
                         key={`${row.invoiceNumber}-${idx}`}
                         row={{...row}}
                         currentUser={currentUser}
                         currentRole={currentRole}
                         onPreview={() => onPreview(row)}
                         onEdit={(r) => router.push(`/invoice/edit/${r.invoiceNumber}?type=${r.documentType}`)}
                         onDelete={setDeleteTarget} 
                         hideClient={true}
                       />
                     ))
                   )}
                 </tbody>
              </table>
           </div>
        </div>
      </main>

      {/* Floating Action Button (Theme Colored) */}
      <div className="fixed bottom-8 right-8 lg:hidden z-50">
         <button 
           onClick={() => router.push(`/invoice?client=${encodeURIComponent(clientName)}`)}
           className="w-16 h-16 rounded-full bg-brand-primary text-white shadow-3xl shadow-brand-primary/40 flex items-center justify-center active:scale-90 transition-all border-4 border-white"
         >
           <Plus className="w-8 h-8" />
         </button>
      </div>

      {/* Modal for Deletion Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-3xl text-center space-y-6">
            <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-3xl mx-auto flex items-center justify-center">
               <AlertCircle className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900">Serious Request!</h3>
              <p className="text-slate-500 font-medium leading-relaxed">
                You are about to permanently delete <strong>{deleteTarget.invoiceNumber}</strong> for <strong>{deleteTarget.clientName}</strong>. This is irreversible.
              </p>
            </div>
            <div className="flex gap-4 pt-4">
              <button 
                onClick={() => setDeleteTarget(null)}
                className="flex-1 h-14 rounded-2xl bg-slate-100 text-slate-900 font-black hover:bg-slate-200 transition-all"
              >
                Go Back
              </button>
              <button 
                onClick={async () => {
                   const t = toast.loading("Purging data...");
                   try {
                     const res = await fetch("/api/invoice-history", {
                        method: "DELETE",
                        body: JSON.stringify({
                          invoiceNumber: deleteTarget.invoiceNumber,
                          currentUser,
                          documentType: deleteTarget.documentType
                        })
                     });
                     if(!res.ok) throw new Error("Delete failed");
                     toast.success("Successfully Deleted", { id: t });
                     setDeleteTarget(null);
                     fetchClientHistory(); // Refresh the list
                   } catch (e) {
                     toast.error("Cleanup Failed", { id: t });
                   }
                }}
                className="flex-1 h-14 rounded-2xl bg-rose-600 text-white font-black shadow-xl shadow-rose-200 hover:bg-rose-700 transition-all"
              >
                Yes, Purge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Preview Modal */}
      {previewInvoice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 sm:p-10 animate-in fade-in duration-300">
           <div className="w-full max-w-6xl h-full bg-white shadow-3xl rounded-[3rem] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
               <div className="flex px-10 py-8 items-center justify-between border-b border-slate-100 flex-none bg-slate-50/50">
                  <div className="flex items-center gap-5">
                     <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-primary">
                        <FileText className="w-7 h-7" />
                     </div>
                     <div>
                        <div className="flex items-center gap-3">
                           <h2 className="text-2xl font-black text-slate-900 tracking-tight">{previewInvoice.documentType}</h2>
                        </div>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">ID: {previewInvoice.invoiceNumber}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <button 
                       onClick={downloadPreview} 
                       className="h-14 px-10 rounded-2xl bg-brand-primary hover:bg-brand-end text-white font-black shadow-xl shadow-brand-primary/20 transition-all active:scale-95 flex items-center gap-3"
                     >
                        <Download className="w-5 h-5" />
                        Download PDF
                     </button>
                     <button 
                       onClick={() => setPreviewInvoice(null)} 
                       className="w-14 h-14 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center"
                     >
                        <ArrowLeft className="w-6 h-6 rotate-90" />
                     </button>
                  </div>
               </div>
               <div className="flex-1 overflow-y-auto bg-slate-100/50 p-6 md:p-12 scrollbar-hide">
                  <div className="mx-auto w-fit shadow-2xl rounded-lg overflow-hidden ring-1 ring-black/5 scale-[0.9] origin-top">
                    <InvoicePreview value={previewInvoice} forwardRef={previewRef} />
                  </div>
               </div>
           </div>
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  currency?: string;
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
  trend?: string;
  subValue?: string;
  progress?: number;
}

function StatCard({ label, value, currency, icon, bgColor, textColor, trend, subValue, progress }: StatCardProps) {
  return (
    <div className="group bg-white p-7 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 transition-all hover:-translate-y-1">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl ${bgColor} flex items-center justify-center ${textColor}`}>
          {icon}
        </div>
        {trend && (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black">
            <TrendingUp className="w-3 h-3" />
            {trend}
          </div>
        )}
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <h3 className={`text-3xl font-black tabular-nums transition-colors ${textColor === 'text-brand-primary' ? 'text-slate-900 group-hover:text-brand-primary' : textColor}`}>
        {currency && <span className="text-sm font-bold text-slate-400 mr-2">{currency}</span>}
        {value}
      </h3>
      {subValue && <p className="mt-2 text-xs font-bold text-slate-400">{subValue}</p>}
      {progress !== undefined && (
        <div className="mt-4 w-full bg-slate-50 h-2 rounded-full overflow-hidden border border-slate-100">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ${textColor.replace('text-', 'bg-')}`} 
            style={{ width: `${progress}%` }} 
          />
        </div>
      )}
    </div>
  );
}
