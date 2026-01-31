"use client";

import { useRouter } from "next/navigation";
import React from "react";
import toast from "react-hot-toast";
import Image from "next/image";
import { useTheme } from "@/components/ThemeProvider";
import { Eye, EyeOff, Lock, User, HelpCircle, CheckCircle, ChevronRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { logoUrl, companyName } = useTheme();

  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
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

    <main className="min-h-screen flex items-center justify-center bg-[#fafafa] relative overflow-hidden selection:bg-brand-100 selection:text-brand-900 p-4">
      {/* Deep Themed Mesh Background - Aurora Effect */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-brand-start/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] bg-brand-end/10 rounded-full blur-[150px] animate-pulse delay-1000" />
      </div>

      {/* Mathematical & Graph Aesthetics Background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.07]">
        {/* Sine Wave Graph Line */}
        <svg className="absolute top-[15%] left-0 w-full h-[200px] text-brand-primary" viewBox="0 0 1000 100" preserveAspectRatio="none">
          <path d="M0,50 Q125,0 250,50 T500,50 T750,50 T1000,50" fill="none" stroke="currentColor" strokeWidth="0.5" className="animate-[dash_10s_linear_infinite]" strokeDasharray="10,10" />
        </svg>
        
        {/* Data Points / Geometric Accents */}
        <div className="absolute top-[10%] left-[15%] w-2 h-2 rounded-full bg-brand-primary/40" />
        <div className="absolute top-[40%] right-[10%] w-3 h-3 border border-brand-primary/30 rotate-45" />
        <div className="absolute bottom-[20%] left-[5%] w-1.5 h-1.5 rounded-full bg-brand-end/30" />
        
        {/* Coordinate Axis Lines */}
        <div className="absolute top-[10%] left-[10%] w-[1px] h-[80%] bg-gradient-to-b from-transparent via-brand-primary/20 to-transparent" />
        <div className="absolute top-[50%] left-[5%] w-[90%] h-[1px] bg-gradient-to-r from-transparent via-brand-primary/20 to-transparent" />
        
        {/* Mathematical Formulas (Faint Text) */}
        <div className="absolute top-[20%] right-[20%] text-[10px] font-mono text-brand-primary/20 whitespace-nowrap rotate-12">Σ(xᵢ - x̄)² / (n - 1)</div>
        <div className="absolute bottom-[25%] right-[30%] text-[8px] font-mono text-brand-primary/20 whitespace-nowrap -rotate-12">y = mx + b</div>
        <div className="absolute top-[60%] left-[10%] text-[9px] font-mono text-brand-primary/20 whitespace-nowrap tracking-tighter">∫ f(x) dx</div>
      </div>
      
      {/* Themed Architectural Grid */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
           style={{ 
             backgroundImage: `linear-gradient(var(--color-brand-primary) 1px, transparent 1px), linear-gradient(90deg, var(--color-brand-primary) 1px, transparent 1px)`,
             backgroundSize: '80px 80px' 
           }} />
      <div className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none" 
           style={{ 
             backgroundImage: `linear-gradient(var(--color-brand-primary) 0.5px, transparent 0.5px), linear-gradient(90deg, var(--color-brand-primary) 0.5px, transparent 0.5px)`,
             backgroundSize: '20px 20px' 
           }} />
      
      <div className="relative z-10 w-full max-w-[380px] group/container">
        <div className="bg-white/95 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] shadow-brand-500/5 p-8 sm:p-11 border border-white relative overflow-hidden transition-all duration-700 hover:shadow-brand-primary/10">
          {/* Glowing themed accent line at top */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-start via-brand-primary to-brand-end" />
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-start via-brand-primary to-brand-end blur-sm opacity-50" />
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-4 mb-8">
             <div className="relative group">
                <div className="absolute inset-0 bg-brand-primary/10 blur-xl rounded-full scale-125 group-hover:bg-brand-primary/20 transition-all duration-500" />
                <Image src={logoUrl || "/logo-js.png"} alt="Logo" width={110} height={110} className="object-contain relative z-10 drop-shadow-sm transition-transform duration-500 group-hover:scale-105" />
             </div>
          
           <div className="space-y-1.5">
             <h2 className="text-[10px] font-black text-brand-primary uppercase tracking-[0.5em]">{companyName || "Just Search Web Design L.L.C."}</h2>
             <h1 className="text-3xl font-black text-slate-900 tracking-tight">Login Portal</h1>
             <p className="text-slate-400 text-[12px] font-bold">Secure administrative access</p>
           </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5 group">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Username</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors">
                  <User className="w-4 h-4" />
                </div>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-12 rounded-xl bg-slate-50/50 border border-slate-100 pl-11 pr-4 text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary transition-all outline-none placeholder:text-slate-300 shadow-sm"
                  placeholder="Username"
                  autoComplete="username"
                  autoFocus
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-1.5 group">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Password</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 rounded-xl bg-slate-50/50 border border-slate-100 pl-11 pr-12 text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary transition-all outline-none placeholder:text-slate-300 shadow-sm"
                  placeholder="Password"
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-slate-400 hover:text-brand-primary transition-colors rounded-lg hover:bg-slate-100"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative">
                  <input type="checkbox" className="peer sr-only" />
                  <div className="w-4 h-4 rounded border border-slate-200 bg-slate-50 peer-checked:bg-brand-primary peer-checked:border-brand-primary transition-all" />
                  <CheckCircle className="absolute inset-0 w-4 h-4 text-white scale-0 peer-checked:scale-75 transition-transform" />
                </div>
                <span className="text-[11px] font-bold text-slate-500 group-hover:text-slate-700 transition-colors uppercase tracking-tight">Remember me</span>
              </label>
              <button type="button" className="text-[11px] font-bold text-brand-primary/80 hover:text-brand-primary uppercase tracking-tight transition-colors">
                Forgot Password?
              </button>
            </div>

           {error && (
             <div className="text-center rounded-xl bg-red-50 p-3 text-xs font-medium text-red-600 border border-red-100">
               {error}
             </div>
           )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full h-12 rounded-xl bg-gradient-to-r from-brand-start to-brand-end text-white font-black text-xs shadow-lg shadow-brand-primary/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 overflow-hidden relative group/btn ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-brand-primary/30 hover:-translate-y-0.5'}`}
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              {loading ? (
                 <div className="flex items-center gap-2">
                   <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                   <span className="tracking-wide">AUTHENTICATING...</span>
                 </div>
              ) : (
                <>
                  <span className="tracking-widest uppercase">Sign In</span>
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
        </form>
        
        <div className="mt-8 text-center space-y-5">
           <div className="flex items-center justify-center gap-3">
              <div className="h-px w-8 bg-slate-100" />
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Support</p>
              <div className="h-px w-8 bg-slate-100" />
           </div>
           
           <div className="flex items-center justify-center">
              <a href="mailto:support@justsearch.ae" className="flex items-center gap-2 px-3 py-1.5 bg-slate-50/50 rounded-lg border border-slate-100 hover:border-brand-primary/20 hover:bg-white transition-all group">
                <HelpCircle className="w-3 h-3 text-slate-400 group-hover:text-brand-primary" />
                <span className="text-[9px] font-black text-slate-400 group-hover:text-slate-600 uppercase">Support</span>
              </a>
           </div>

           <div className="pt-2">
             <div className="flex items-center justify-center gap-1.5 mb-1 opacity-40">
                <div className="w-1 h-1 rounded-full bg-slate-400" />
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">SECURE SYSTEM</p>
                <div className="w-1 h-1 rounded-full bg-slate-400" />
             </div>
             <p className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.1em]">
               © {new Date().getFullYear()} {companyName || "Just Search"}
             </p>
           </div>
        </div>
      </div>
    </div>
  </main>
  );
}
