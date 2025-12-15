import "./globals.css";
import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "JS InvoiceCraft",
  description: "Editable invoice builder with PDF export",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo-js-old.png" />
      </head>
      <body className="min-h-screen font-sans antialiased bg-slate-100">
        {children}
      </body>
    </html>
  );
}

