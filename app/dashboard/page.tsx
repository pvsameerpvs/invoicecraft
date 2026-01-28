import React, { Suspense } from "react";
import DashboardContent from "@/app/dashboard/DashboardContent";

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
