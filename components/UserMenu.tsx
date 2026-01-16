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
          className="group flex items-center gap-2 rounded-full bg-white p-1 pr-3 shadow-md ring-1 ring-slate-200 transition-all hover:ring-brand-primary/50 hover:shadow-lg active:scale-95"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-brand-start to-brand-end text-sm font-bold text-white shadow-sm ring-2 ring-white">
            {username.charAt(0).toUpperCase()}
          </div>
          <span className="hidden text-sm font-medium text-slate-700 sm:block max-w-[100px] truncate">
             {username}
          </span>
          <div className={`ml-1 text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}>
             <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </button>
  
        {isOpen && (
          <div className="absolute right-0 top-full z-[120] mt-3 w-72 origin-top-right rounded-2xl bg-white p-2 shadow-2xl ring-1 ring-slate-900/5 animate-in fade-in zoom-in-95 duration-200">
             
             {/* Profile Section */}
             <div className="mb-2 rounded-xl bg-slate-50 p-4 border border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-start to-brand-end text-lg font-bold text-white shadow-md ring-4 ring-white">
                        {username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">{username}</p>
                        <p className="text-xs text-brand-primary font-medium capitalize">{currentRole || "User"}</p>
                    </div>
                </div>
                <button 
                   onClick={() => {
                      setIsOpen(false);
                      router.push("/profile");
                   }}
                   className="mt-3 w-full rounded-lg bg-white border border-slate-200 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-brand-primary hover:border-brand-200 transition-all"
                >
                   View Profile
                </button>
             </div>

             <div className="space-y-1">
                 {currentRole === "admin" && (
                   <button
                     onClick={() => {
                       setIsOpen(false);
                       router.push("/activity");
                     }}
                     className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-brand-primary transition-colors"
                   >
                     <Activity className="h-4 w-4" />
                     Activity Logs
                   </button>
                 )}
                 
                 <button
                     onClick={() => {
                       setIsOpen(false);
                       router.push("/dashboard");
                     }}
                     className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-brand-primary transition-colors"
                   >
                     <LayoutDashboard className="h-4 w-4" />
                     Dashboard
                   </button>

                  <button
                     onClick={() => {
                       setIsOpen(false);
                       router.push("/invoice");
                     }}
                     className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-brand-primary transition-colors"
                   >
                     <PlusCircle className="h-4 w-4" />
                     New Invoice
                   </button>
      
                  <button
                     onClick={() => {
                       setIsOpen(false);
                       router.push("/history");
                     }}
                     className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-brand-primary transition-colors"
                   >
                     <History className="h-4 w-4" />
                     Invoice History
                   </button>
             </div>
             
             <div className="my-2 border-t border-slate-100"></div>
  
             <button
               // Just open the modal, don't logout immediately
               onClick={() => {
                   setIsOpen(false);
                   setIsLogoutModalOpen(true);
               }}
               className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
             >
               <LogOut className="h-4 w-4" />
               Sign Out
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
