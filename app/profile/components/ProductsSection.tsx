"use client";

import React, { useEffect, useState } from "react";
import { Trash2, Plus, Search, Package } from "lucide-react";
import toast from "react-hot-toast";

interface Product {
  label: string;
  amount: string;
}

export function ProductsSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // New Product State
  const [newLabel, setNewLabel] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data);
      }
    } catch (e) {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel) return;

    setIsAdding(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newLabel, amount: newAmount }),
      });

      if (!res.ok) throw new Error("Failed to add");

      toast.success("Product added");
      setNewLabel("");
      setNewAmount("");
      fetchProducts();
    } catch (e) {
      toast.error("Failed to add product");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (label: string) => {
    if (!confirm(`Delete "${label}"?`)) return;

    // Optimistic update
    const old = [...products];
    setProducts(products.filter(p => p.label !== label));

    try {
      const res = await fetch("/api/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
      });

      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Product deleted");
      fetchProducts(); // Sync to be sure
    } catch (e) {
      setProducts(old);
      toast.error("Failed to delete product");
    }
  };

  const filtered = products.filter(p => 
    p.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Product Management</h2>
        <div className="text-sm text-slate-500">{products.length} Products</div>
      </div>

      {/* Add Form */}
      <form onSubmit={handleAdd} className="bg-white p-4 rounded-xl border border-orange-200 shadow-sm flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
            <label className="text-xs font-semibold text-slate-500 uppercase">Product Name</label>
            <input 
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                placeholder="e.g. Website Design"
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                required
            />
        </div>
        <div className="w-full md:w-32">
            <label className="text-xs font-semibold text-slate-500 uppercase">Price</label>
            <input 
                type="number"
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                placeholder="0.00"
                value={newAmount}
                onChange={e => setNewAmount(e.target.value)}
            />
        </div>
        <button 
            type="submit" 
            disabled={isAdding || !newLabel}
            className="h-10 px-6 bg-brand-primary text-white font-medium rounded-lg hover:bg-brand-end transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[100px]"
        >
            {isAdding ? "Adding..." : <><Plus size={16} /> Add</>}
        </button>
      </form>

      {/* List */}
      <div className="bg-white rounded-xl border border-orange-200 shadow-sm overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-orange-100 bg-orange-50/50">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none text-sm"
                    placeholder="Search products..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>
        </div>

        {/* Table */}
        <div className="max-h-[500px] overflow-y-auto">
            {loading ? (
                <div className="p-8 text-center text-slate-500">Loading products...</div>
            ) : filtered.length === 0 ? (
                <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
                    <Package size={48} className="opacity-20" />
                    <p>No products found</p>
                </div>
            ) : (
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100 sticky top-0">
                        <tr>
                            <th className="px-4 py-3">Product Name</th>
                            <th className="px-4 py-3 w-32">Price</th>
                            <th className="px-4 py-3 w-16"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filtered.map((p, i) => (
                            <tr key={i} className="hover:bg-slate-50 group transition-colors">
                                <td className="px-4 py-3 font-medium text-slate-900">{p.label}</td>
                                <td className="px-4 py-3 text-slate-600">{p.amount || "-"}</td>
                                <td className="px-4 py-3 text-right">
                                    <button 
                                        onClick={() => handleDelete(p.label)}
                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
      </div>
    </div>
  );
}
