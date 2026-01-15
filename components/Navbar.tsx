"use client";

import React from "react";
import Image from "next/image";
import { UserMenu } from "./UserMenu";
import { useTheme } from "@/components/ThemeProvider";

interface NavbarProps {
  label?: string; // e.g. "v1.0 Editor" or "v1.0 History"
  variant?: "white" | "transparent";
}

export function Navbar({ label, variant = "white" }: NavbarProps) {
  const { logoUrl } = useTheme();
  // Styles based on variant
  const bgClass = variant === "white" 
    ? "bg-white border-b border-slate-200" 
    : "bg-white/90 backdrop-blur-md border-b border-white/20"; // Glass effect for history if needed

  return (
    <header className={`sticky top-0 z-50 flex h-16 w-full flex-none items-center justify-between px-4 shadow-sm transition-all sm:px-6 ${bgClass}`}>
      <div className="flex items-center gap-4">
        {/* Logo */}
        <div className="relative h-10 w-[100px] sm:w-[150px]">
             <Image 
                src={logoUrl || "/logo-js.png"} 
                alt="Logo" 
                fill
                className="object-contain object-left"
                priority
             />
        </div>
        
        {/* Version Badge (Optional) */}
        {label && (
          <span className="hidden rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-brand-primary sm:inline-flex ring-1 ring-orange-500/10">
            {label}
          </span>
        )}
      </div>

      {/* Right Side: User Menu */}
      <UserMenu />
    </header>
  );
}
