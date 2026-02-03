"use client";

import { Menu, X } from "lucide-react";
import { UserMenu } from "./UserMenu";
import { useTheme } from "@/components/ThemeProvider";
import { NotificationCenter } from "./NotificationCenter";

interface NavbarProps {
  label?: string; // e.g. "v1.0 Editor" or "v1.0 History"
  variant?: "white" | "transparent";
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export function Navbar({ label, variant = "white", onToggleMobileMenu, isMobileMenuOpen }: NavbarProps) {
  const { logoUrl, logoSize, companyName, showCompanyName, navbarTitle } = useTheme();
  // Styles based on variant
  const bgClass = variant === "white" 
    ? "bg-white border-b border-slate-200" 
    : "bg-white/90 backdrop-blur-md border-b border-white/20"; // Glass effect for history if needed

  return (
    <header className={`sticky top-0 z-50 flex h-16 w-full flex-none items-center justify-between px-4 shadow-sm transition-all sm:px-6 ${bgClass}`}>
      <div className="flex items-center gap-4">
        {/* Mobile Menu Toggle */}
        <button 
          onClick={onToggleMobileMenu}
          className="flex items-center justify-center p-2 text-slate-500 hover:bg-slate-50 rounded-lg md:hidden transition-all active:scale-95"
          aria-label="Toggle Menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Logo - Hidden on mobile, moved to sidebar */}
        <div className="hidden md:flex items-center">
             <img 
                src={logoUrl || "/logo-js.png"} 
                alt="Logo" 
                className="w-auto object-contain object-left transition-all duration-300"
                style={{ height: `${Math.min(56, Math.max(20, logoSize * 0.6))}px` }}
             />
        </div>
        
        {/* Company Name (Optional) */}
        {showCompanyName && (navbarTitle || companyName) && (
            <span className="text-sm md:text-lg font-bold text-slate-900 hidden xs:block truncate max-w-[150px] md:max-w-none md:ml-4">
                {navbarTitle || companyName}
            </span>
        )}
        
        {/* Version Badge (Optional) */}
        {label && (
          <span className="hidden rounded-full bg-brand-100 px-3 py-1 text-[10px] md:text-xs font-medium text-brand-primary sm:inline-flex ring-1 ring-brand-500/10 whitespace-nowrap ml-2">
            {label}
          </span>
        )}
      </div>

      {/* Right Side: Notification & User Menu */}
      <div className="flex items-center gap-2 md:gap-3">
        <NotificationCenter />
        <UserMenu />
      </div>
    </header>
  );
}
