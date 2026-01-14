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

export default function ProfilePage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("personal_info");

  const [role, setRole] = useState<"admin" | "user">("user");

  useEffect(() => {
    const u = localStorage.getItem("invoicecraft:username");
    const r = localStorage.getItem("invoicecraft:role") as "admin" | "user";
    if (u) {
      setUsername(u);
      setRole(r || "user");
    } else {
      router.push("/");
    }
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
      localStorage.removeItem("invoicecraft:username");
      localStorage.removeItem("invoicecraft:role");
      toast.success("Logged out successfully");
      router.push("/");
  };

  if (loading) return null;

  const initials = username ? username.charAt(0).toUpperCase() : "?";
  const isAdmin = role === "admin";

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col relative">
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
                    onLogout={handleLogout}
                    username={username}
                    initials={initials}
                />
            </div>

            {/* Content Area */}
            <div className="lg:col-span-9 space-y-6">
                {activeTab === "personal_info" && (
                    <PersonalInfoSection username={username} isAdmin={isAdmin} />
                )}
                
                {activeTab === "user_management" && isAdmin && (
                    <UserManagementSection />
                )}

                {activeTab === "products" && isAdmin && (
                    <ProductsSection />
                )}

                {/* Other Settings Tabs */}
                {["security", "notifications", "language"].includes(activeTab) && (
                    <SettingsSection activeTab={activeTab} />
                )}
            </div>
        </div>
      </main>
    </div>
  );
}
