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
import { SettingsSection } from "./components/SettingsSection";

export default function ProfilePage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("personal_info");

  useEffect(() => {
    const u = localStorage.getItem("invoicecraft:username");
    if (u) {
      setUsername(u);
    } else {
      router.push("/");
    }
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
      localStorage.removeItem("invoicecraft:username");
      toast.success("Logged out successfully");
      router.push("/");
  };

  if (loading) return null;

  const initials = username ? username.charAt(0).toUpperCase() : "?";
  const isAdmin = username === "admin";

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar label="Profile" variant="white" />
      
      <ProfileHeader username={username} initials={initials} isAdmin={isAdmin} />
      
      <main className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Sidebar */}
            <div className="space-y-6">
                <ProfileSidebar 
                    activeTab={activeTab} 
                    setActiveTab={setActiveTab} 
                    isAdmin={isAdmin}
                    onLogout={handleLogout}
                />
            </div>

            {/* Content Area */}
            <div className="lg:col-span-2 space-y-6">
                {activeTab === "personal_info" && (
                    <PersonalInfoSection username={username} isAdmin={isAdmin} />
                )}
                
                {activeTab === "user_management" && isAdmin && (
                    <UserManagementSection />
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
