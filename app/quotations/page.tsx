import React, { Suspense } from "react";
import { HistoryContainer } from "../../components/history/HistoryContainer";

export default function QuotationsPage() {
  return (
    <Suspense fallback={<div>Loading Quotations...</div>}>
      <HistoryContainer documentType="Quotation" />
    </Suspense>
  );
}
