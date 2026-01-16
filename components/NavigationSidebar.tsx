"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
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
  Building2
} from "lucide-react";
import toast from "react-hot-toast";

export function NavigationSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState("");

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
    { label: "History", href: "/history", icon: History },
    ...(isAdmin ? [{ label: "Activity Logs", href: "/activity", icon: Activity }] : []),
    ...(isAdmin ? [{ label: "Company Details", href: "/profile?tab=company_details", icon: Building2 }] : []),
    { label: "Settings", href: "/profile?tab=security", icon: Settings },
    { label: "Profile", href: "/profile?tab=personal_info", icon: User },
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
    <aside 
      className={`relative z-30 flex flex-col border-r border-slate-200 bg-white/50 backdrop-blur-xl transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-16" : "w-64"
      } hidden md:flex`}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 z-40 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:text-brand-primary"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Header / Logo Area Placeholder or Spacer */}
      {/* Since Navbar is usually above, this might just be spacing or redundant. 
          For now, just some top padding nicely. */}
      <div className="h-4" />

      {/* Nav Items */}
      <nav className="flex-1 space-y-2 p-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
          
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                isActive 
                  ? "bg-brand-50 text-brand-primary shadow-sm" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon 
                size={20} 
                className={`${isActive ? "text-brand-primary" : "text-slate-400 group-hover:text-slate-600"}`} 
              />
              
              {!isCollapsed && (
                <span className="truncate">{item.label}</span>
              )}
              
              {/* Active Indicator Line */}
              {isActive && !isCollapsed && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-primary" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="border-t border-slate-100 p-2">
        <button
          onClick={handleLogoutClick}
          className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-red-50 hover:text-red-600`}
          title={isCollapsed ? "Logout" : undefined}
        >
          <LogOut size={20} className="text-slate-400 group-hover:text-red-500" />
          {!isCollapsed && <span>Logout</span>}
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
