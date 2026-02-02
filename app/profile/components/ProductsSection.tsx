"use client";

import React, { useEffect, useState } from "react";
import { Trash2, Plus, Search, Package, Edit2 } from "lucide-react";
import { Skeleton } from "../../../components/ui/skeleton";
import toast from "react-hot-toast";
import { BUSINESS_PROFILES } from "@/lib/businessProfiles";

interface Product {
  label: string;
  amount: string;
  profile: string;
}

export function ProductsSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("Product");
  
  // New Product State
  const [newLabel, setNewLabel] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);

  // Modal State
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
    handleCancelEdit(); // Clear form when switching tabs
  }, [activeTab]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products?profile=${activeTab}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data);
      }
    } catch (e) {
      toast.error("Failed to load items");
    } finally {
      setLoading(false);
    }
  };

  const currentProfile = BUSINESS_PROFILES[activeTab] || BUSINESS_PROFILES["Product"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel) return;

    setIsAdding(true);
    try {
      if (editingItem) {
        // UPDATE
        const res = await fetch("/api/products", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                originalLabel: editingItem,
                newLabel: newLabel, 
                newAmount: newAmount,
                profile: activeTab 
            }),
        });

        if (!res.ok) throw new Error("Failed to update");
        toast.success("Item updated");
        setEditingItem(null);
      } else {
        // CREATE
        const res = await fetch("/api/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ label: newLabel, amount: newAmount, profile: activeTab }),
        });

        if (!res.ok) throw new Error("Failed to add");
        toast.success("Item added");
      }

      setNewLabel("");
      setNewAmount("");
      fetchProducts();
    } catch (e) {
      toast.error(editingItem ? "Failed to update" : "Failed to add");
    } finally {
      setIsAdding(false);
    }
  };

  const handleEditClick = (product: Product) => {
      setEditingItem(product.label);
      setNewLabel(product.label);
      setNewAmount(product.amount);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
      setEditingItem(null);
      setNewLabel("");
      setNewAmount("");
  };

  const handleDeleteClick = (label: string) => {
      setProductToDelete(label);
      setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    const label = productToDelete;

    try {
      const res = await fetch("/api/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, profile: activeTab }),
      });

      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Item deleted");
      fetchProducts();
    } catch (e) {
      toast.error("Failed to delete");
    } finally {
        setProductToDelete(null);
        setIsDeleteModalOpen(false);
    }
  };

  const filtered = products.filter(p => 
    p.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">{currentProfile.catalogTitle}</h2>
          <div className="text-sm text-slate-500">{products.length} Items</div>
        </div>

        {/* Catalog Tabs */}
        <div className="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-xl">
            {Object.keys(BUSINESS_PROFILES).map((id) => (
                <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        activeTab === id 
                        ? "bg-white text-brand-primary shadow-sm" 
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                >
                    {BUSINESS_PROFILES[id].label}
                </button>
            ))}
        </div>

        {/* Add/Edit Form */}
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-xl border border-brand-200 shadow-sm flex flex-col md:flex-row gap-4 items-end relative overflow-hidden">
          {editingItem && (
              <div className="absolute top-0 left-0 w-1 bg-brand-primary h-full"></div>
          )}
          <div className="flex-[2] w-full">
              <label className="text-xs font-semibold text-slate-500 uppercase">
                  {currentProfile.fields.descLabel}
              </label>
              <input 
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                  placeholder={`e.g. ${activeTab === 'Product' ? 'Website Design' : activeTab === 'Hourly' ? 'Senior Developer' : 'Development Phase 1'}`}
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  required
              />
          </div>
          <div className="flex-1 w-full">
              <label className="text-xs font-semibold text-slate-500 uppercase">
                  {currentProfile.fields.priceLabel}
              </label>
              <input 
                  type="number"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                  placeholder="0.00"
                  value={newAmount}
                  onChange={e => setNewAmount(e.target.value)}
              />
          </div>
          <div className="flex gap-2">
              {editingItem && (
                  <button 
                      type="button"
                      onClick={handleCancelEdit}
                      className="h-10 px-4 text-slate-500 font-medium rounded-lg hover:bg-slate-100 transition-colors"
                  >
                      Cancel
                  </button>
              )}
              <button 
                  type="submit" 
                  disabled={isAdding || !newLabel}
                  className={`h-10 px-6 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[100px] ${
                      editingItem ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-brand-primary text-white hover:bg-brand-end"
                  }`}
              >
                  {isAdding ? (editingItem ? "Updating..." : "Adding...") : (
                      editingItem ? "Update" : <><Plus size={16} /> Add to Catalog</>
                  )}
              </button>
          </div>
        </form>

        {/* List */}
        <div className="bg-white rounded-xl border border-brand-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-brand-100 bg-brand-50/50">
              <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                      className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none text-sm"
                      placeholder={`Search ${currentProfile.label.toLowerCase()} items...`}
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                  />
              </div>
          </div>

          <div className="max-h-[500px] overflow-y-auto">
              {loading ? (
                  <div className="p-4 bg-white">
                      {[...Array(3)].map((_, i) => (
                          <div key={i} className="flex gap-4 py-3 border-b border-slate-50 items-center">
                              <Skeleton className="h-4 w-1/2" />
                              <Skeleton className="h-4 w-20" />
                              <Skeleton className="h-8 w-20 ml-auto" />
                          </div>
                      ))}
                  </div>
              ) : filtered.length === 0 ? (
                  <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
                      <Package size={48} className="opacity-20" />
                      <p>No items in this catalog yet</p>
                  </div>
              ) : (
                  <table className="w-full text-sm text-left font-medium">
                      <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 sticky top-0 uppercase tracking-wider text-[10px]">
                          <tr>
                              <th className="px-4 py-3">{currentProfile.fields.descLabel}</th>
                              <th className="px-4 py-3 w-40">{currentProfile.fields.priceLabel}</th>
                              <th className="px-4 py-3 w-24 text-right">Actions</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                          {filtered.map((p, i) => (
                              <tr key={i} className={`group transition-colors ${editingItem === p.label ? "bg-brand-50" : "hover:bg-slate-50"}`}>
                                  <td className="px-4 py-3 text-slate-900">{p.label}</td>
                                  <td className="px-4 py-3 text-brand-primary font-bold">
                                      {p.amount ? `${p.amount}` : "-"}
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                      <div className="flex justify-end gap-1">
                                          <button 
                                              onClick={() => handleEditClick(p)}
                                              className="p-1.5 text-slate-400 hover:text-brand-primary hover:bg-brand-50 rounded-md transition-colors"
                                              title="Edit"
                                          >
                                              <Edit2 size={16} />
                                          </button>
                                          <button 
                                              onClick={() => handleDeleteClick(p.label)}
                                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                              title="Delete"
                                          >
                                              <Trash2 size={16} />
                                          </button>
                                      </div>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              )}
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6">
                <div className="text-center">
                    <h3 className="text-lg font-bold text-slate-900">Delete Item</h3>
                    <p className="mt-2 text-sm text-slate-500">
                        Are you sure you want to delete <span className="font-semibold text-slate-900">"{productToDelete}"</span>?
                    </p>
                </div>
                <div className="mt-6 flex gap-3">
                    <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-xl">Cancel</button>
                    <button onClick={confirmDelete} className="flex-1 py-2 text-sm font-semibold text-white bg-red-600 rounded-xl">Delete</button>
                </div>
            </div>
        </div>
      )}
    </>
  );
}
