"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { DashboardContainer } from "../../components/DashboardContainer";
import { Navbar } from "../../components/Navbar";

export default function DashboardPage() {
  const router = useRouter();

  return (
    <div className="flex h-screen flex-col bg-slate-50">
         <Navbar label="Dashboard" variant="white" />
         <DashboardContainer onCreateInvoice={() => router.push("/invoice")} />
    </div>
  );
}
