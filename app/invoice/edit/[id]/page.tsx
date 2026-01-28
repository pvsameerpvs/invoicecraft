import React, { Suspense } from "react";
import { InvoiceEditorContainer } from "../../../../components/InvoiceEditorContainer";

interface Props {
  params: {
    id: string;
  };
}

export default function EditInvoicePage({ params }: Props) {
  // Decode the ID in case it has special chars
  const id = decodeURIComponent(params.id);
  
  return (
    <Suspense fallback={<div>Loading Editor...</div>}>
      <InvoiceEditorContainer initialInvoiceId={id} />
    </Suspense>
  );
}
