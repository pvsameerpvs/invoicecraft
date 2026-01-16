"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";

interface UnsavedChangesContextType {
  isDirty: boolean;
  setIsDirty: (value: boolean) => void;
  checkUnsavedChanges: (onConfirm: () => void) => void;
}

const UnsavedChangesContext = createContext<UnsavedChangesContextType | undefined>(undefined);

export function UnsavedChangesProvider({ children }: { children: React.ReactNode }) {
  const [isDirty, setIsDirty] = useState(false);
  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; onConfirm: (() => void) | null }>({
    isOpen: false,
    onConfirm: null,
  });

  const checkUnsavedChanges = (onConfirm: () => void) => {
    if (isDirty) {
      setModalConfig({ isOpen: true, onConfirm });
    } else {
      onConfirm();
    }
  };

  const handleConfirm = () => {
    if (modalConfig.onConfirm) {
      modalConfig.onConfirm();
    }
    setModalConfig({ isOpen: false, onConfirm: null });
    // Note: We don't automatically set isDirty to false here, as the action might be opening a dropdown, not navigating away.
  };

  const handleCancel = () => {
    setModalConfig({ isOpen: false, onConfirm: null });
  };

  return (
    <UnsavedChangesContext.Provider value={{ isDirty, setIsDirty, checkUnsavedChanges }}>
      {children}

      {/* Global Unsaved Changes Modal */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6 transform transition-all scale-100 animate-in fade-in zoom-in-95">
                <div className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 mb-4">
                        <AlertTriangle className="h-6 w-6 text-amber-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Unsaved Changes</h3>
                    <p className="mt-2 text-sm text-slate-500">
                        You have unsaved changes. Are you sure you want to leave? Your progress may be lost.
                    </p>
                </div>
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={handleCancel}
                        className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                    >
                        Stay Here
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-1 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-600/20 hover:bg-amber-700 transition-colors"
                    >
                        Leave Page
                    </button>
                </div>
            </div>
        </div>
      )}
    </UnsavedChangesContext.Provider>
  );
}

export function useUnsavedChanges() {
  const context = useContext(UnsavedChangesContext);
  if (context === undefined) {
    throw new Error("useUnsavedChanges must be used within a UnsavedChangesProvider");
  }
  return context;
}
