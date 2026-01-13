"use client";

import React from "react";
import { InvoiceEditorContainer } from "../../../../components/InvoiceEditorContainer";

interface Props {
  params: {
    id: string;
  };
}

export default function EditInvoicePage({ params }: Props) {
  // Decode the ID in case it has special chars, though usually not needed for simple IDs
  const id = decodeURIComponent(params.id);
  
  return <InvoiceEditorContainer initialInvoiceId={id} />;
}
