"use client";

import React, { Suspense } from "react";
import { usePathname } from "next/navigation";
import { NavigationSidebar } from "./NavigationSidebar";
import { Navbar } from "./Navbar";

import { UnsavedChangesProvider } from "./providers/UnsavedChangesContext";

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Pages where sidebar should NOT appear
  const noSidebarRoutes = ["/", "/login"]; 
  const showSidebar = !noSidebarRoutes.includes(pathname || "");

  if (!showSidebar) {
    return <>{children}</>;
  }

  // Determine Navbar Props based on route
  let navLabel = "";
  let navVariant: "white" | "transparent" = "white";

  if (pathname?.startsWith("/dashboard")) {
      navLabel = "Dashboard";
  } else if (pathname?.startsWith("/invoice")) {
      navLabel = "v1.0 Editor";
  } else if (pathname?.startsWith("/history")) {
      navLabel = "Invoice History";
  } else if (pathname?.startsWith("/quotations")) {
      navLabel = "Quotation History";
  } else if (pathname?.startsWith("/activity")) {
      navLabel = "Admin Activity Log";
      // navVariant = "transparent"; // Keep white for structural consistency in "proper" layout
  } else if (pathname?.startsWith("/profile")) {
      navLabel = "Profile";
      // navVariant = "transparent";
  }

  const isInvoicePage = pathname?.startsWith("/invoice");

  return (
    <UnsavedChangesProvider>
        <div className="flex h-screen flex-col bg-slate-50 overflow-hidden">
        {/* Global Header - Full Width */}
        <Navbar label={navLabel} variant={navVariant} />

        <div className="flex flex-1 overflow-hidden">
            {/* Global Sidebar - Below Header */}
            {!isInvoicePage && (
                <Suspense fallback={<div className="hidden md:flex w-64 bg-white/50 border-r border-slate-200" />}>
                    <NavigationSidebar />
                </Suspense>
            )}
            
            {/* Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-y-auto relative">
            {children}
            </div>
        </div>
        </div>
    </UnsavedChangesProvider>
  );
}
