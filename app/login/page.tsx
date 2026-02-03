"use client";

import { useRouter } from "next/navigation";
import React from "react";
import toast from "react-hot-toast";
import Image from "next/image";
import { useTheme } from "@/components/ThemeProvider";
import { Eye, EyeOff, Lock, User, HelpCircle, CheckCircle, ChevronRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { logoUrl, companyName, logoSize } = useTheme();

  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [rememberMe, setRememberMe] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  // Initialize from localStorage if Remember Me was selected previously
  React.useEffect(() => {
    const savedRemember = localStorage.getItem("invoicecraft:remember") === "true";
    const savedUsername = localStorage.getItem("invoicecraft:savedUsername");
    if (savedRemember && savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, []);

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
        
        // Handle Remember Me
        if (rememberMe) {
          localStorage.setItem("invoicecraft:remember", "true");
          localStorage.setItem("invoicecraft:savedUsername", username);
        } else {
          localStorage.removeItem("invoicecraft:remember");
          localStorage.removeItem("invoicecraft:savedUsername");
        }

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

    <main className="min-h-screen flex items-center justify-center bg-[#f8f9fa] relative overflow-hidden selection:bg-brand-100 selection:text-brand-900 p-4 font-sans">
      {/* 1. DYNAMIC ATMOSPHERIC CORE - Multi-layered light rays */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-[radial-gradient(circle_at_center,var(--color-brand-start)_0%,transparent_60%)] opacity-[0.15] animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] bg-[radial-gradient(circle_at_center,var(--color-brand-end)_0%,transparent_60%)] opacity-[0.15] animate-[pulse_10s_ease-in-out_infinite_1s]" />
        <div className="absolute top-[30%] left-[20%] w-[40%] h-[40%] bg-brand-primary/10 rounded-full blur-[120px] animate-pulse" />
      </div>

      {/* 2. ARCHITECTURAL SVG MESH - Sophisticated Waves */}
      <svg className="absolute inset-0 w-full h-full z-0 opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hexGrid" width="50" height="43.3" patternUnits="userSpaceOnUse" viewBox="0 0 50 43.3">
            <path d="M25 0L50 14.4V43.3L25 28.9L0 43.3V14.4L25 0Z" fill="none" stroke="var(--color-brand-primary)" strokeWidth="0.5" opacity="0.3" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hexGrid)" />
        
        {/* Animated Architectural Flow */}
        <path d="M0,600 Q250,400 500,600 T1000,600" fill="none" stroke="var(--color-brand-primary)" strokeWidth="1" strokeDasharray="10 20" opacity="0.4">
          <animate attributeName="d" dur="30s" repeatCount="indefinite" values="M0,600 Q250,400 500,600 T1000,600; M0,600 Q250,800 500,600 T1000,600; M0,600 Q250,400 500,600 T1000,600" />
        </path>
      </svg>

      {/* 3. TECHNICAL DASHBOARD ELEMENTS (Rich Detail) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Global Grid with Coordinate Markers */}
        <div className="absolute inset-0 opacity-[0.04]" 
             style={{ 
               backgroundImage: `linear-gradient(var(--color-brand-primary) 1.5px, transparent 1.5px), linear-gradient(90deg, var(--color-brand-primary) 1.5px, transparent 1.5px)`,
               backgroundSize: '120px 120px',
               backgroundPosition: 'center center'
             }} />
        
        {/* Coordinate Text (Faint Hex Codes) */}
        <div className="absolute top-[10%] left-[5%] text-[8px] font-mono text-brand-primary/30 rotate-90 tracking-widest whitespace-nowrap uppercase">System_Active: 0x8F2A9C</div>
        <div className="absolute bottom-[10%] right-[5%] text-[8px] font-mono text-brand-primary/30 -rotate-90 tracking-widest whitespace-nowrap uppercase">Secure_Encryption: SHA-256</div>
        
        {/* Orbiting Technical Nodes */}
        <div className="absolute top-[20%] right-[15%] w-48 h-48 border border-brand-primary/10 rounded-full animate-[spin_40s_linear_infinite]" />
        <div className="absolute top-[20%] right-[15%] w-48 h-48 border-t-2 border-brand-primary/20 rounded-full animate-[spin_20s_linear_infinite]" />
        
        {/* Corner Precision Markers */}
        <div className="absolute top-12 left-12 w-10 h-px bg-gradient-to-r from-brand-primary/40 to-transparent" />
        <div className="absolute top-12 left-12 h-10 w-px bg-gradient-to-b from-brand-primary/40 to-transparent" />
        <div className="absolute top-12 left-12 w-2 h-2 border-t-2 border-l-2 border-brand-primary" />

        <div className="absolute bottom-12 right-12 w-10 h-px bg-gradient-to-l from-brand-primary/40 to-transparent" />
        <div className="absolute bottom-12 right-12 h-10 w-px bg-gradient-to-t from-brand-primary/40 to-transparent" />
        <div className="absolute bottom-12 right-12 w-2 h-2 border-b-2 border-r-2 border-brand-primary" />
      </div>

      {/* 4. MOVING LIGHT STREAMS */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[40%] -left-[10%] w-[120%] h-px bg-gradient-to-r from-transparent via-brand-primary/30 to-transparent animate-[pan_12s_linear_infinite]" />
        <div className="absolute bottom-[30%] -left-[10%] w-[120%] h-px bg-gradient-to-r from-transparent via-brand-primary/20 to-transparent animate-[pan_18s_linear_infinite_reverse]" />
      </div>

      {/* 5. TEXTURE & DEPTH */}
      <div className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] backdrop-contrast-125 brightness-110" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-brand-primary/5 blur-[120px] rounded-full z-0" />
      
      <div className="relative z-10 w-full max-w-[340px] group/container">
        <div className="bg-white/95 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] p-6 sm:p-8 border border-white relative overflow-hidden transition-all duration-700 hover:shadow-brand-primary/20">
          {/* Glowing themed accent line at top */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-start via-brand-primary to-brand-end" />
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-start via-brand-primary to-brand-end blur-md opacity-30" />
          
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-4 mb-6">
             <div className="relative select-none">
                <img 
                    src={logoUrl || "/logo-js.png"} 
                    alt="Logo" 
                    className="object-contain" 
                    style={{ height: `${Math.max(40, (logoSize || 80) * 0.6)}px`, width: 'auto' }} 
                />
             </div>
          
           <div className="space-y-1">
             <h2 className="text-[9px] font-black text-brand-primary/60 uppercase tracking-[0.3em]">{companyName || "SECURE PORTAL"}</h2>
             <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Login Portal</h1>
             <p className="text-slate-400 text-[9px] font-bold uppercase tracking-tight opacity-70">Administrative Interface Access</p>
           </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1 group">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Username</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors">
                  <User className="w-3.5 h-3.5" />
                </div>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-11 rounded-xl bg-slate-50/50 border border-slate-100 pl-10 pr-4 text-[13px] font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary transition-all outline-none placeholder:text-slate-300 shadow-sm"
                  placeholder="Username"
                  autoComplete="username"
                  autoFocus
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-1 group">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Password</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 rounded-xl bg-slate-50/50 border border-slate-100 pl-10 pr-10 text-[13px] font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary transition-all outline-none placeholder:text-slate-300 shadow-sm"
                  placeholder="Password"
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-slate-400 hover:text-brand-primary transition-colors rounded-lg hover:bg-slate-100"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-0.5 pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    className="peer sr-only" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <div className="w-3.5 h-3.5 rounded border border-slate-200 bg-slate-50 peer-checked:bg-brand-primary peer-checked:border-brand-primary transition-all" />
                  <CheckCircle className="absolute inset-0 w-3.5 h-3.5 text-white scale-0 peer-checked:scale-75 transition-transform" />
                </div>
                <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-700 transition-colors uppercase tracking-tight">Remember</span>
              </label>
            </div>

           {error && (
             <div className="text-center rounded-xl bg-red-50 p-2.5 text-[11px] font-medium text-red-600 border border-red-100">
               {error}
             </div>
           )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full h-11 rounded-xl bg-gradient-to-r from-brand-start to-brand-end text-white font-black text-[11px] shadow-lg shadow-brand-primary/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 overflow-hidden relative group/btn ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-brand-primary/30 hover:-translate-y-0.5'}`}
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              {loading ? (
                 <div className="flex items-center gap-2">
                   <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                   <span className="tracking-wide">LOGGING IN...</span>
                 </div>
              ) : (
                <>
                  <span className="tracking-widest uppercase">Sign In</span>
                  <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
        </form>
        
        <div className="mt-6 text-center space-y-4">
           <div className="flex items-center justify-center gap-3">
              <div className="h-px w-6 bg-slate-100" />
              <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em]">Support</p>
              <div className="h-px w-6 bg-slate-100" />
           </div>
           
           <div className="flex items-center justify-center">
              <a href="mailto:support@justsearch.ae" className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50/50 rounded-lg border border-slate-100 hover:border-brand-primary/20 hover:bg-white transition-all group">
                <HelpCircle className="w-3 h-3 text-slate-400 group-hover:text-brand-primary" />
                <span className="text-[8px] font-black text-slate-400 group-hover:text-slate-600 uppercase">Support</span>
              </a>
           </div>

           <div className="opacity-40">
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
