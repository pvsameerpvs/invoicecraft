import React from "react";
import { Loader2 } from "lucide-react";

export const PremiumLoader = () => {
  return (
    <div className="fixed top-16 inset-x-0 bottom-0 z-[9999] flex flex-col items-center justify-center bg-white/50 backdrop-blur-md">
      <div className="relative flex flex-col items-center">
        {/* Animated Document Icon */}
        <div className="relative w-24 h-32 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden mb-8 animate-float">
            {/* Header Line */}
            <div className="absolute top-4 left-4 right-4 h-2 bg-slate-100 rounded-full w-2/3" />
            
            {/* Content Lines */}
            <div className="absolute top-10 left-4 right-4 space-y-2">
                <div className="h-1.5 bg-slate-100 rounded-full w-full" />
                <div className="h-1.5 bg-slate-100 rounded-full w-5/6" />
                <div className="h-1.5 bg-slate-100 rounded-full w-full" />
                <div className="h-1.5 bg-slate-100 rounded-full w-4/6" />
            </div>

            {/* Scanning Effect */}
            <div className="absolute top-0 left-0 w-full h-1 bg-brand-500/50 shadow-[0_0_15px_color-mix(in_srgb,var(--color-brand-500),transparent_50%)] animate-scan" />
            
            {/* Bottom Accent */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-brand-500" />
        </div>

        {/* Text */}
        <div className="flex flex-col items-center gap-2">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Invoice<span className="text-brand-600">Craft</span></h3>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
                <span>Preparing Editor...</span>
            </div>
        </div>

        {/* CSS for custom animations */}
        <style jsx>{`
            @keyframes scan {
                0% { top: 0%; opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { top: 100%; opacity: 0; }
            }
            @keyframes float {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }
            .animate-scan {
                animation: scan 2s linear infinite;
            }
            .animate-float {
                animation: float 3s ease-in-out infinite;
            }
        `}</style>
      </div>
    </div>
  );
};
