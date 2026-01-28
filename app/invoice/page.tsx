import React, { Suspense } from "react";
import { InvoiceEditorContainer } from "../../components/InvoiceEditorContainer";

export default function InvoicePage() {
  return (
    <Suspense fallback={<div>Loading Editor...</div>}>
      <InvoiceEditorContainer />
    </Suspense>
  );
}
