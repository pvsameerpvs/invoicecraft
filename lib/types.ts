export interface LineItem {
  id: string;
  description: string;
  amount: string; // keep as string for easy editing
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
  lineItems: LineItem[];
  currency: string;
  overrideTotal?: string;
  footerNote: string;
  bankDetails: BankDetails;
  signatureLabel: string;
  status?: "Paid" | "Unpaid";
}
