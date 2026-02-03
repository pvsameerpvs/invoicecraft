"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  Activity, 
  User, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Settings,
  Building2,
  FileText,
  Users,
  FilePlus,
  PlusSquare
} from "lucide-react";
import toast from "react-hot-toast";
import { useUnsavedChanges } from "./providers/UnsavedChangesContext";
import { useTheme } from "./ThemeProvider";

interface NavigationSidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function NavigationSidebar({ isMobileOpen, onCloseMobile }: NavigationSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { logoUrl, logoSize, companyName } = useTheme();

  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState("");
  const { checkUnsavedChanges } = useUnsavedChanges();

  useEffect(() => {
    const role = localStorage.getItem("invoicecraft:role");
    const user = localStorage.getItem("invoicecraft:username");
    if (role === "admin") setIsAdmin(true);
    if (user) setUsername(user);
    
    // Auto-collapse on small screens? Optional.
    const handleResize = () => {
        if (window.innerWidth < 1024) setIsCollapsed(true);
    };
    window.addEventListener("resize", handleResize);
    handleResize(); // Initial check
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const menuItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "New Invoice", href: "/invoice", icon: PlusCircle },
    { label: "New Quotation", href: "/invoice?type=Quotation", icon: PlusSquare },
    { label: "Invoice History", href: "/history", icon: History },
    { label: "Quotation History", href: "/quotations", icon: FileText },
    { label: "Clients", href: "/clients", icon: Users },
    ...(isAdmin ? [{ label: "Activity Logs", href: "/activity", icon: Activity }] : []),
    { label: "Profile", href: "/profile?tab=personal_info", icon: User },
    ...(isAdmin ? [{ label: "Company Details", href: "/profile?tab=company_details", icon: Building2 }] : []),
    { label: "Settings", href: "/profile?tab=security", icon: Settings },
   
  ];

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleLogoutClick = () => {
      setIsLogoutModalOpen(true);
  };

  const confirmLogout = async () => {
     try {
        await fetch("/api/logout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username }) 
        });
    } catch (e) {
        console.error("Logout failed", e);
    }
    localStorage.removeItem("invoicecraft:username");
    localStorage.removeItem("invoicecraft:role");
    toast.success("Logged out");
    router.push("/");
  };

  return (
    <>
    {/* Mobile Backdrop */}
    {isMobileOpen && (
      <div 
        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden transition-opacity duration-300"
        onClick={onCloseMobile}
      />
    )}

    <aside 
      className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white shadow-2xl transition-all duration-300 ease-in-out md:relative md:z-30 md:bg-white/50 md:backdrop-blur-xl md:shadow-none ${
        isMobileOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0"
      } ${
        isCollapsed ? "md:w-16" : "md:w-64"
      }`}
    >
      {/* Toggle Button - Desktop Only */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 z-40 hidden md:flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:text-brand-primary"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Header Area / Logo - Mobile Only */}
      <div className={`p-4 border-b border-slate-100/50 flex items-center gap-3 md:hidden ${isCollapsed ? "justify-center" : "justify-start"}`}>
          <img 
              src={logoUrl || "/logo-js.png"} 
              alt="Logo" 
              className={`w-auto object-contain transition-all duration-300 ${isCollapsed && !isMobileOpen ? "h-6" : "h-10"}`}
          />
          {(!isCollapsed || isMobileOpen) && (
             <span className="font-extrabold text-slate-900 truncate tracking-tight text-lg">
                {companyName || "InvoiceCraft"}
             </span>
          )}
      </div>

      <div className="h-2 md:h-4" />

      {/* Nav Items */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {menuItems.map((item) => {
          let isActive = false;

          if (item.href.includes("?")) {
              const [basePath, queryString] = item.href.split("?");
              const params = new URLSearchParams(queryString);
              const tabParam = params.get("tab");
              const currentTab = searchParams.get("tab");
              
              isActive = pathname === basePath && currentTab === tabParam;
          } else {
              isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href) && !searchParams.get("tab"));
          }
          
          return (
            <button
              key={item.href}
              onClick={() => {
                checkUnsavedChanges(() => {
                  router.push(item.href);
                  if (onCloseMobile) onCloseMobile();
                });
              }}
              className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                isActive 
                  ? "bg-brand-50 text-brand-primary shadow-sm" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon 
                size={20} 
                className={`flex-shrink-0 ${isActive ? "text-brand-primary" : "text-slate-400 group-hover:text-slate-600"}`} 
              />
              
              {( !isCollapsed || (typeof window !== 'undefined' && window.innerWidth < 768) || isMobileOpen ) && (
                <span className="truncate">{item.label}</span>
              )}
              
              {isActive && (!isCollapsed || (typeof window !== 'undefined' && window.innerWidth < 768)) && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-primary" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="border-t border-slate-100 p-3">
        <button
          onClick={handleLogoutClick}
          className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-red-50 hover:text-red-600`}
          title={isCollapsed ? "Logout" : undefined}
        >
          <LogOut size={20} className="flex-shrink-0 text-slate-400 group-hover:text-red-500" />
          {(!isCollapsed || (typeof window !== 'undefined' && window.innerWidth < 768)) && <span>Logout</span>}
        </button>
      </div>
    </aside>

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
