export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: string; // was amount
}

export interface BankDetails {
  companyName: string;
  bankName: string;
  bankLabel: string;
  accountIban: string;
  accountNumber: string;
}

export interface InvoiceData {
  logoDataUrl?: string;
  invoiceTo: string;
  invoiceToCompany: string;
  invoiceToAddress: string;
  invoiceNumber: string;
  date: string;
  subject: string;
  fromCompanyName: string;
  fromCompanyAddress: string;
  fromCompanyTrn?: string;
  fromCompanyEmail?: string;
  fromCompanyPhone?: string;
  lineItems: LineItem[];
  currency: string;
  overrideTotal?: string;
  discount?: string;
  footerNote: string;
  bankDetails: BankDetails;
  signatureLabel: string;
  status?: "Paid" | "Unpaid";
  documentType: "Invoice" | "Quotation";
  sourceQuotation?: string;
}

export interface InvoiceHistoryRow {
  createdAt: string;
  invoiceNumber: string;
  date: string;
  clientName: string;
  subject: string;
  currency: string;
  subtotal: string;
  vat: string;
  total: string;
  payloadJson: string; 
  createdBy: string;
  status: string;
  documentType: "Invoice" | "Quotation";
}
