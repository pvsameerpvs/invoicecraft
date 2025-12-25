"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export function UserMenu() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Client-side only
    const u = localStorage.getItem("invoicecraft:username");
    if (u) setUsername(u);
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

  const handleLogout = () => {
    // Clear auth
    document.cookie = "js_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    localStorage.removeItem("invoicecraft:username");
    
    toast.success("Logged out");
    router.push("/");
  };

  if (!username) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 rounded-xl bg-white p-2 pr-4 shadow-sm ring-1 ring-orange-200 hover:ring-brand-primary/50 transition-all"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary text-xs font-bold text-white uppercase shadow-md shadow-brand-primary/20">
          {username.charAt(0)}
        </div>
        <div className="flex flex-col items-start text-xs">
           <span className="font-semibold text-slate-900">{username}</span>
           <span className="text-[10px] text-slate-400">View Profile</span>
        </div>
        
        {/* Simple down arrow using CSS border */}
        <div className={`ml-auto h-0 w-0 border-l-[4px] border-r-[4px] border-t-[4px] border-l-transparent border-r-transparent border-t-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-2 w-48 rounded-xl bg-white p-1 shadow-xl ring-1 ring-orange-100">
           <div className="px-3 py-2 border-b border-orange-50 mb-1">
              <p className="text-xs font-medium text-slate-900">Signed in as</p>
              <p className="text-xs text-slate-500 truncate">{username}</p>
           </div>
           
           <button
             onClick={handleLogout}
             className="w-full text-left rounded-lg px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
           >
             Logout
           </button>
        </div>
      )}
    </div>
  );
}
