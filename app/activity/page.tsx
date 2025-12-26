"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { UserMenu } from "../../components/UserMenu";
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

  useEffect(() => {
    const user = localStorage.getItem("invoicecraft:username");
    if (user !== "admin") {
      toast.error("Access Denied: Admin only");
      router.push("/");
      return;
    }
    setIsAdmin(true);

    // Fetch logs
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

  if (!isAdmin) return null; // protection

  return (
    <div className="h-screen flex flex-col bg-orange-50 selection:bg-orange-100 selection:text-orange-900 overflow-hidden">
      <header className="flex-none sticky top-0 z-50 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6">
        <div className="flex items-center gap-4">
          <Image src="/logo-js.png" alt="Logo" width={150} height={150} className="w-[100px] h-auto sm:w-[150px]" />
          {/* <span className="hidden rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 sm:inline-flex">
            Admin Activity Log
          </span> */}
        </div>
        <UserMenu />
      </header>

      <main className="flex-1 flex flex-col min-h-0 relative">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-br from-brand-start to-brand-end -z-0" />

        {/* Fixed Top Content */}
        <div className="relative z-10 flex-none px-4 pt-8 pb-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between text-white">
                <div>
                   <h1 className="text-3xl font-bold tracking-tight">User Activity Logs</h1>
                   <p className="mt-2 text-white/80 text-sm max-w-2xl">
                     Monitor secure login events and invoice modifications.
                   </p>
                </div>
                
                <div className="flex gap-3">
                    <button
                    onClick={() => router.push("/invoice")}
                    className="h-10 rounded-xl bg-white/10 px-4 text-sm font-medium text-white shadow-sm hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-all"
                    >
                    Back to Editor
                    </button>
                </div>
            </div>
        </div>

        {/* Scrollable Table Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-8 sm:px-6 lg:px-8 relative z-10">
            {loading ? (
                <div className="flex h-64 items-center justify-center rounded-3xl bg-white shadow-lg shadow-slate-200/50">
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-t-brand-primary" />
                        <span className="text-sm font-medium text-slate-500">Loading logs...</span>
                    </div>
                </div>
            ) : (
                <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/50 ring-1 ring-slate-100">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-orange-100">
                            <thead className="sticky top-0 z-20">
                                <tr className="border-b border-orange-100 bg-orange-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    <th className="px-6 py-4 text-left">Timestamp</th>
                                    <th className="px-6 py-4 text-left">User</th>
                                    <th className="px-6 py-4 text-left">Action</th>
                                    <th className="px-6 py-4 text-left">Device Info</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-orange-100 bg-white">
                                {logs.map((log, idx) => (
                                    <tr key={idx} className="hover:bg-orange-50 transition-colors">
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
                                                : log.action === "LOGOUT"
                                                ? "bg-slate-100 text-slate-800"
                                                : log.action.startsWith("DELETED")
                                                ? "bg-red-100 text-red-800"
                                                : "bg-orange-100 text-orange-800"
                                            }`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate" title={log.userAgent}>
                                            {log.userAgent}
                                        </td>
                                    </tr>
                                ))}
                                {logs.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-sm text-slate-500">
                                            No activity logs found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
      </main>
    </div>
  );
}
