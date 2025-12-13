"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

export default function HomePage() {
  const router = useRouter();

  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      router.push("/invoice");
      return;
    }

    setError("Invalid username or password.");
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 sm:py-12">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-6xl items-center justify-center">
        <div className="w-full max-w-md sm:max-w-xl overflow-hidden rounded-2xl bg-white shadow-lg">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 border-b border-slate-100 p-5 sm:p-6">
            <img
              src="/logo-js.png"
              alt="JS InvoiceCraft"
              className="h-10 w-auto object-contain"
            />
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-slate-900">
                JS InvoiceCraft
              </h1>
              <p className="text-sm text-slate-500">
                Create professional A4 tax invoices and export to PDF.
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="space-y-4 p-5 sm:p-6">
            <div className="rounded-xl bg-slate-50 p-4">
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="mt-1 inline-block h-2 w-2 rounded-full bg-slate-900" />
                  Add preset services or custom items
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 inline-block h-2 w-2 rounded-full bg-slate-900" />
                  Automatic VAT (5%) calculation
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 inline-block h-2 w-2 rounded-full bg-slate-900" />
                  Multi-page A4 preview and PDF export
                </li>
              </ul>
            </div>

            {/* Login */}
            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700">
                  Username
                </label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                  placeholder="Enter username"
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                  placeholder="Enter password"
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
              >
                Login & Open Invoice Editor
              </button>

              <div className="text-center text-xs text-slate-500">
                <span className="mr-1">Need access?</span>
                <Link
                  href="/invoice"
                  className="pointer-events-none text-slate-300 underline"
                >
                  Open Invoice Editor
                </Link>
              </div>
            </form>

            <div className="text-xs text-slate-500">
              Tip: Upload your logo in the editor.
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 px-5 sm:px-6 py-4 text-center text-xs text-slate-500">
            © {new Date().getFullYear()} Just Search Web design L.L.C.
          </div>
        </div>
      </div>
    </main>
  );
}
