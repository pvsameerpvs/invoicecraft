"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { UserMenu } from "../../components/UserMenu";
import { Skeleton } from "../../components/ui/skeleton";
import toast from "react-hot-toast";

type ActivityLog = {
  timestamp: string;
  username: string;
  action: string;
  userAgent: string;
};

export default function ActivityPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // View State
  const [activeTab, setActiveTab] = useState<"invoices" | "system">("invoices");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  useEffect(() => {
    const role = localStorage.getItem("invoicecraft:role");

    if (role !== "admin") {
      toast.error("Access Denied: Admin only");
      router.push("/dashboard");
      return;
    }
    setIsAdmin(true);

    fetch("/api/activity")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setLogs(data);
        } else {
            toast.error("Failed to load logs");
        }
      })
      .catch(() => toast.error("Error loading activity"))
      .finally(() => setLoading(false));
  }, [router]);

  // Grouping Logic
  const { invoiceGroups, systemLogs } = React.useMemo(() => {
    const iGroups: Record<string, ActivityLog[]> = {};
    const sLogs: ActivityLog[] = [];

    logs.forEach(log => {
      // Parse Action: "CREATED INV-123" -> Action: CREATED, ID: INV-123
      const match = log.action.match(/^(CREATED|UPDATED|DELETED)\s+(.+)$/);
      if (match) {
        const id = match[2];
        if (!iGroups[id]) iGroups[id] = [];
        iGroups[id].push(log);
      } else {
        sLogs.push(log);
      }
    });

    // Convert map to array for sorting
    const groupArray = Object.keys(iGroups).map(id => {
      const groupLogs = iGroups[id];
      // Sort logs desc (newest first)
      groupLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      return {
        id,
        logs: groupLogs,
        lastModified: groupLogs[0].timestamp,
        lastAction: groupLogs[0].action.split(" ")[0], // Just the verb
        lastUser: groupLogs[0].username,
        createdBy: groupLogs.find(l => l.action.startsWith("CREATED"))?.username || groupLogs[groupLogs.length - 1].username
      };
    });

    // Sort groups by last modified
    groupArray.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());

    return { invoiceGroups: groupArray, systemLogs: sLogs };
  }, [logs]);

  if (!isAdmin) return null;

  return (
    <div className="h-screen flex flex-col bg-brand-50 selection:bg-brand-100 selection:text-brand-900 overflow-hidden">
      <header className="flex-none sticky top-0 z-50 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6">
        <div className="flex items-center gap-4">
          <Image src="/logo-js.png" alt="Logo" width={150} height={150} className="w-[100px] h-auto sm:w-[150px]" />
          <span className="hidden rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 sm:inline-flex">
            Admin Activity Log
          </span>
        </div>
        <UserMenu />
      </header>

      <main className="flex-1 flex flex-col min-h-0 relative">
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-br from-brand-start to-brand-end -z-0" />

        {/* Header Controls */}
        <div className="relative z-10 flex-none px-4 pt-8 pb-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between text-white">
                <div>
                   <h1 className="text-3xl font-bold tracking-tight">Activity Dashboard</h1>
                   <p className="mt-2 text-white/80 text-sm max-w-2xl">
                     Monitor system events and invoice history.
                   </p>
                </div>
                
                <div className="flex gap-3">
                     {/* Tabs */}
                    <div className="flex rounded-xl bg-white/20 p-1 backdrop-blur-sm border border-white/20">
                        <button
                          onClick={() => setActiveTab("invoices")}
                          className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${
                            activeTab === "invoices" 
                            ? "bg-white text-brand-primary shadow-sm" 
                            : "text-white hover:bg-white/10"
                          }`}
                        >
                          Invoice History
                        </button>
                        <button
                          onClick={() => setActiveTab("system")}
                          className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${
                            activeTab === "system" 
                            ? "bg-white text-brand-primary shadow-sm" 
                            : "text-white hover:bg-white/10"
                          }`}
                        >
                          System Logs
                        </button>
                    </div>

                    <button
                        onClick={() => router.push("/invoice")}
                        className="h-10 rounded-xl bg-white/10 px-4 text-sm font-medium text-white shadow-sm hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-all"
                    >
                        Back to Editor
                    </button>
                </div>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-4 pb-8 sm:px-6 lg:px-8 relative z-10">
            {loading ? (
                <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/50 ring-1 ring-slate-100">
                    <div className="w-full overflow-x-auto">
                        <table className="min-w-full divide-y divide-brand-100">
                             <thead className="bg-brand-50">
                                <tr>
                                    <th className="px-6 py-4"><Skeleton className="h-4 w-20" /></th>
                                    <th className="px-6 py-4"><Skeleton className="h-4 w-32" /></th>
                                    <th className="px-6 py-4"><Skeleton className="h-4 w-24" /></th>
                                    <th className="px-6 py-4"><Skeleton className="h-4 w-24" /></th>
                                    <th className="px-6 py-4 text-right"><Skeleton className="h-4 w-16 ml-auto" /></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-100 bg-white">
                                {[...Array(5)].map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-4 w-40" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-8 w-16 ml-auto rounded-lg" /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/50 ring-1 ring-slate-100">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-brand-100">
                            {/* INVOICE GROUPS TABLE */}
                            {activeTab === "invoices" && (
                                <>
                                <thead className="sticky top-0 z-20">
                                    <tr className="border-b border-brand-100 bg-brand-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        <th className="px-6 py-4 text-left">Invoice #</th>
                                        <th className="px-6 py-4 text-left">Last Modified</th>
                                        <th className="px-6 py-4 text-left">Latest Action</th>
                                        <th className="px-6 py-4 text-left">Modified By</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                    <tbody className="divide-y divide-brand-100 bg-white">
                                    {invoiceGroups.map((group) => (
                                        <tr key={group.id} className="hover:bg-brand-50 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-brand-primary">
                                                {group.id}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                {new Date(group.lastModified).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold leading-5 ${
                                                    group.lastAction === "CREATED" 
                                                    ? "bg-green-100 text-green-800"
                                                    : group.lastAction === "DELETED"
                                                    ? "bg-red-100 text-red-800"
                                                    : "bg-brand-100 text-brand-800"
                                                }`}>
                                                    {group.lastAction}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                                                {group.lastUser}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => setSelectedInvoiceId(group.id)}
                                                    className="rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-100 transition-colors"
                                                >
                                                    View History
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {invoiceGroups.length === 0 && (
                                         <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No invoice activity found.</td></tr>
                                    )}
                                </tbody>
                                </>
                            )}

                            {/* SYSTEM LOGS TABLE */}
                            {activeTab === "system" && (
                                <>
                                <thead className="sticky top-0 z-20">
                                    <tr className="border-b border-brand-100 bg-brand-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        <th className="px-6 py-4 text-left">Timestamp</th>
                                        <th className="px-6 py-4 text-left">User</th>
                                        <th className="px-6 py-4 text-left">Action</th>
                                        <th className="px-6 py-4 text-left">Device Info</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-brand-100 bg-white">
                                    {systemLogs.map((log, idx) => (
                                        <tr key={idx} className="hover:bg-brand-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                                {log.username}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold leading-5 ${
                                                    log.action === "LOGIN" 
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-slate-100 text-slate-800"
                                                }`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate" title={log.userAgent}>
                                                {log.userAgent}
                                            </td>
                                        </tr>
                                    ))}
                                     {systemLogs.length === 0 && (
                                         <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">No system logs found.</td></tr>
                                    )}
                                </tbody>
                                </>
                            )}
                        </table>
                    </div>
                </div>
            )}
        </div>
      </main>

      {/* INVOICE HISTORY MODAL */}
      {selectedInvoiceId && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
              <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
                  <div className="flex flex-none items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
                       <div>
                          <h3 className="text-lg font-bold text-slate-900">Activity History</h3>
                          <p className="text-sm text-slate-500">{selectedInvoiceId}</p>
                       </div>
                       <button
                          onClick={() => setSelectedInvoiceId(null)}
                          className="rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
                       >
                          Close
                       </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto bg-white">
                      <table className="min-w-full divide-y divide-slate-100">
                          <thead className="bg-slate-50 sticky top-0 shadow-sm z-10">
                              <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Time</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Device</th>
                              </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-100">
                              {invoiceGroups.find(g => g.id === selectedInvoiceId)?.logs.map((log, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50">
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                          {new Date(log.timestamp).toLocaleString()}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                          {log.username}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold leading-5 ${
                                                log.action.includes("CREATED") 
                                                ? "bg-green-100 text-green-800"
                                                : log.action.includes("DELETED")
                                                ? "bg-red-100 text-red-800"
                                                : "bg-brand-100 text-brand-800"
                                            }`}>
                                                {log.action}
                                            </span>
                                      </td>
                                      <td className="px-6 py-4 text-xs text-slate-400 max-w-xs truncate" title={log.userAgent}>
                                          {log.userAgent}
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
