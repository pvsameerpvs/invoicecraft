"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import toast from "react-hot-toast";
import Image from "next/image";
import { useTheme } from "@/components/ThemeProvider";

export default function HomePage() {
  const router = useRouter();
  const { logoUrl } = useTheme();

  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // Prevent double submission
    setError("");
    setLoading(true);
    const t = toast.loading("Logging in…");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success("Login successful!", { id: t });
        // ✅ Store username and role for session management
        localStorage.setItem("invoicecraft:username", data.username);
        localStorage.setItem("invoicecraft:role", data.role || "user");
        
        router.push("/dashboard");
        return;
      }

      throw new Error("Invalid username or password.");
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message, { id: t });
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-orange-50 relative selection:bg-orange-100 selection:text-orange-900 p-4">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-br from-brand-start to-brand-end z-0" />
      
      <div className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-orange-200/50 p-6 sm:p-10 border border-orange-100">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-4 mb-8">
             <Image src={logoUrl || "/logo-js.png"} alt="Logo" width={150} height={150} className="object-contain" />
          
           <div>
             <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome Back</h1>
             <p className="text-slate-500 text-sm mt-1">Sign in to manage your invoices</p>
           </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
           <div className="space-y-1.5">
             <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Username</label>
             <div className="relative">
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-12 rounded-xl bg-slate-50 border border-slate-200 px-4 text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all outline-none placeholder:text-slate-400"
                  placeholder="Enter your username"
                  autoComplete="username"
                  autoFocus
                  disabled={loading}
                />
             </div>
           </div>

           <div className="space-y-1.5">
             <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Password</label>
             <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 rounded-xl bg-slate-50 border border-slate-200 px-4 text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all outline-none placeholder:text-slate-400"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={loading}
                />
             </div>
           </div>

           {error && (
             <div className="text-center rounded-xl bg-red-50 p-3 text-xs font-medium text-red-600 border border-red-100">
               {error}
             </div>
           )}

           <button
             type="submit"
             disabled={loading}
             className={`w-full h-12 rounded-xl bg-gradient-to-r from-brand-start to-brand-end hover:shadow-brand-primary/30 text-white font-semibold text-sm shadow-xl shadow-brand-primary/20 active:scale-[0.98] transition-all flex items-center justify-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
           >
             {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing In...</span>
                </div>
             ) : (
               "Sign In"
             )}
           </button>
        </form>
        
        <div className="mt-8 pt-8 border-t border-slate-100 text-center">
           <p className="text-xs text-slate-400">
             © {new Date().getFullYear()} Just Search Web Design L.L.C.
           </p>
           <p className="text-[10px] text-slate-300 mt-1">Invoice Management System v1.0</p>
        </div>
      </div>
    </main>
  );
}
