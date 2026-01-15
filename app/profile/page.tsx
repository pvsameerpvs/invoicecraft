"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "../../components/Navbar";
import toast from "react-hot-toast";

// Types
import { TabId } from "./components/types";

// Components
import { ProfileHeader } from "./components/ProfileHeader";
import { ProfileSidebar } from "./components/ProfileSidebar";
import { PersonalInfoSection } from "./components/PersonalInfoSection";
import { UserManagementSection } from "./components/UserManagementSection";
import { ProductsSection } from "./components/ProductsSection";
import { SettingsSection } from "./components/SettingsSection";
import { CompanyDetailsSection } from "./components/CompanyDetailsSection";
import { ThemeSettingsSection } from "./components/ThemeSettingsSection";

import { LogOut } from "lucide-react";

import { Skeleton } from "../../components/ui/skeleton";

export default function ProfilePage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("personal_info");
  const [role, setRole] = useState<"admin" | "user">("user");
  const [userData, setUserData] = useState({ email: "", mobile: "", createdAt: "" });
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // ... (fetchUserData and useEffects remain the same) ...

  const fetchUserData = () => {
      fetch('/api/users')
        .then(res => res.json())
        .then(data => {
            if (data.ok && data.user) {
                setUserData({
                    email: data.user.email,
                    mobile: data.user.mobile,
                    createdAt: data.user.createdAt
                });
                const r = localStorage.getItem("invoicecraft:role");
                if (data.user.role !== r) {
                    setRole(data.user.role);
                    localStorage.setItem("invoicecraft:role", data.user.role);
                }
            }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
  };

  useEffect(() => {
    const u = localStorage.getItem("invoicecraft:username");
    const r = localStorage.getItem("invoicecraft:role") as "admin" | "user";
    if (u) {
      setUsername(u);
      setRole(r || "user");
      fetchUserData();
    } else {
      router.push("/");
      setLoading(false);
    }
  }, [router]);

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
      
      setIsLogoutModalOpen(false);
      toast.success("Logged out successfully");
      router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-50 flex flex-col relative">
        <Navbar label="Profile" variant="transparent" />
        <div className="absolute top-0 left-0 w-full h-64 bg-slate-200 animate-pulse z-0" />
        
        <div className="relative z-10 px-4 md:px-8 pt-8 pb-4">
             {/* Profile Header Skeleton */}
            <div className="flex items-end justify-between">
                <div className="flex items-end gap-6 text-white">
                    <Skeleton className="h-24 w-24 rounded-2xl bg-white/20" />
                    <div className="mb-2 space-y-2">
                         <Skeleton className="h-4 w-32 bg-white/20" />
                         <Skeleton className="h-8 w-48 bg-white/20" />
                    </div>
                </div>
            </div>
        </div>

        <main className="flex-1 px-4 md:px-8 pb-8 max-w-7xl mx-auto w-full relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                 {/* Sidebar Skeleton */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                         <div className="flex flex-col items-center gap-4 mb-8">
                             <Skeleton className="h-24 w-24 rounded-2xl" />
                             <Skeleton className="h-6 w-32" />
                             <Skeleton className="h-4 w-20" />
                         </div>
                         <div className="space-y-4">
                             {[1,2,3,4,5].map(i => (
                                 <Skeleton key={i} className="h-10 w-full rounded-xl" />
                             ))}
                         </div>
                    </div>
                </div>
                
                 {/* Content Skeleton */}
                <div className="lg:col-span-9">
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 space-y-6">
                        <Skeleton className="h-8 w-48 mb-6" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Skeleton className="h-12 w-full rounded-xl" />
                            <Skeleton className="h-12 w-full rounded-xl" />
                            <Skeleton className="h-12 w-full rounded-xl" />
                            <Skeleton className="h-12 w-full rounded-xl" />
                        </div>
                    </div>
                </div>
            </div>
        </main>
      </div>
    );
  }

  const initials = username ? username.charAt(0).toUpperCase() : "?";
  const isAdmin = role === "admin";

  return (
    <div className="min-h-screen bg-brand-50 flex flex-col relative">
      <Navbar label="Profile" variant="transparent" />
      
      {/* Global Background Gradient */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-br from-brand-start to-brand-end z-0" />
      
      {/* Header Area */}
      <div className="relative z-10 px-4 md:px-8 pt-8 pb-4">
          <ProfileHeader username={username} initials={initials} isAdmin={isAdmin} />
      </div>
      
      <main className="flex-1 px-4 md:px-8 pb-8 max-w-7xl mx-auto w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Sidebar (Includes Avatar now) */}
            <div className="lg:col-span-3 space-y-6">
                <ProfileSidebar 
                    activeTab={activeTab} 
                    setActiveTab={setActiveTab} 
                    isAdmin={isAdmin}
                    onLogout={handleLogoutClick}
                    username={username}
                    initials={initials}
                    joinedAt={userData.createdAt}
                />
            </div>

            {/* Content Area */}
            <div className="lg:col-span-9 space-y-6">
                {activeTab === "personal_info" && (
                    <PersonalInfoSection 
                        username={username} 
                        role={role} 
                        email={userData.email} 
                        mobile={userData.mobile}
                        onUpdate={fetchUserData} 
                    />
                )}
                
                {activeTab === "user_management" && isAdmin && (
                    <UserManagementSection currentUser={username} />
                )}

                {activeTab === "products" && isAdmin && (
                    <ProductsSection />
                )}

                {activeTab === "company_details" && isAdmin && (
                    <CompanyDetailsSection />
                )}
                {activeTab === "theme_settings" && isAdmin && (
                    <ThemeSettingsSection />
                )}

                {/* Other Settings Tabs */}
                {["security", "notifications", "language"].includes(activeTab) && (
                    <SettingsSection activeTab={activeTab} username={username} />
                )}
            </div>
        </div>
      </main>

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
    </div>
  );
}
