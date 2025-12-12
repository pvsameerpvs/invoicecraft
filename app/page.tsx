import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="rounded-lg bg-white p-8 shadow">
        <h1 className="mb-4 text-2xl font-semibold">JS InvoiceCraft</h1>
        <p className="mb-6 text-sm text-slate-600">
          Go to the invoice editor to create and export an A4 invoice PDF.
        </p>
        <Link
          href="/invoice"
          className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Open Invoice Editor
        </Link>
      </div>
    </main>
  );
}
