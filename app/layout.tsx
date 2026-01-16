import "./globals.css";
import type { Metadata } from "next";
import React from "react";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "JS InvoiceCraft",
  description: "Editable invoice builder with PDF export",
};

import { ThemeProvider } from "../components/ThemeProvider";
import { SidebarLayout } from "../components/SidebarLayout";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo-js-old.png" />
      </head>
      <body className="min-h-screen font-sans antialiased bg-slate-100">
        <Toaster position="top-center" />
        <ThemeProvider>
          <SidebarLayout>
            {children}
          </SidebarLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}

