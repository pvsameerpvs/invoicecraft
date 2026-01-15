"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Activity, PlusCircle, History, LogOut, LayoutDashboard } from "lucide-react";

export function UserMenu() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [currentRole, setCurrentRole] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Client-side only
    const u = localStorage.getItem("invoicecraft:username");
    const r = localStorage.getItem("invoicecraft:role");
    if (u) setUsername(u);
    if (r) setCurrentRole(r);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const confirmLogout = async () => {
    // Call server to log logout and clear cookie
    try {
        await fetch("/api/logout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username }) 
        });
    } catch (e) {
        console.error("Logout failed", e);
    }
    
    // Clear local storage
    localStorage.removeItem("invoicecraft:username");
    localStorage.removeItem("invoicecraft:role");
    
    setIsLogoutModalOpen(false);
    toast.success("Logged out");
    router.push("/");
  };

  if (!username) return null;

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 rounded-xl bg-white p-2 pr-4 shadow-sm ring-1 ring-brand-200 hover:ring-brand-primary/50 transition-all"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary text-xs font-bold text-white uppercase shadow-md shadow-brand-primary/20">
            {username.charAt(0)}
          </div>
          <div className="hidden flex-col items-start text-xs sm:flex">
             <span className="font-semibold text-slate-900">{username}</span>
             <span className="text-[10px] text-slate-400">View Profile</span>
          </div>
          
          {/* Simple down arrow using CSS border */}
          <div className={`ml-auto hidden h-0 w-0 border-l-[4px] border-r-[4px] border-t-[4px] border-l-transparent border-r-transparent border-t-slate-400 transition-transform sm:block ${isOpen ? "rotate-180" : ""}`} />
        </button>
  
        {isOpen && (
          <div className="absolute right-0 top-full z-[100] mt-2 w-48 rounded-xl bg-white p-1 shadow-xl ring-1 ring-brand-100">
             <div 
               onClick={() => {
                  setIsOpen(false);
                  router.push("/profile");
               }}
               className="px-3 py-2 border-b border-brand-50 mb-1 cursor-pointer hover:bg-brand-50 rounded-t-lg transition-colors"
             >
                <p className="text-xs font-medium text-slate-900">Signed in as</p>
                <p className="text-xs text-slate-500 truncate">{username}</p>
             </div>
             
             {currentRole === "admin" && (
               <button
                 onClick={() => {
                   setIsOpen(false);
                   router.push("/activity");
                 }}
                 className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-primary"
               >
                 <Activity className="h-4 w-4" />
                 Activity Logs
               </button>
             )}
             {/* NEW: Dashboard Link */}
             <button
                 onClick={() => {
                   setIsOpen(false);
                   router.push("/dashboard");
                 }}
                 className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-primary"
               >
                 <LayoutDashboard className="h-4 w-4" />
                 Dashboard
               </button>
  
              {/* NEW: Back to Editor / New Invoice */}
              <button
                 onClick={() => {
                   setIsOpen(false);
                   router.push("/invoice");
                 }}
                 className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-primary"
               >
                 <PlusCircle className="h-4 w-4" />
                 New Invoice
               </button>
  
              <button
                 onClick={() => {
                   setIsOpen(false);
                   router.push("/history");
                 }}
                 className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-primary"
               >
                 <History className="h-4 w-4" />
                 Invoice History
               </button>
             
             <div className="my-1 border-t border-slate-100"></div>
  
             <button
               // Just open the modal, don't logout immediately
               onClick={() => {
                   setIsOpen(false);
                   setIsLogoutModalOpen(true);
               }}
               className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50"
             >
               <LogOut className="h-4 w-4" />
               Logout
             </button>
          </div>
        )}
      </div>

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6 transform transition-all scale-100">
                <div className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
                        <LogOut className="h-6 w-6 text-red-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Confirm Logout</h3>
                    <p className="mt-2 text-sm text-slate-500">
                        Are you sure you want to log out of your account?
                    </p>
                </div>
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={() => setIsLogoutModalOpen(false)}
                        className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                    >
                        No, Stay
                    </button>
                    <button
                        onClick={confirmLogout}
                        className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-600/20 hover:bg-red-700 transition-colors"
                    >
                        Yes, Logout
                    </button>
                </div>
            </div>
        </div>
      )}
    </>
  );
}
