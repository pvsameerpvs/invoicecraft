"use client";

import React, { useState, useEffect, useRef } from "react";
import { Input } from "./ui/input";
import { Search, User, MapPin } from "lucide-react";

interface Client {
  name: string;
  address: string;
  email?: string;
  phone?: string;
}

interface ClientSelectProps {
  value: string;
  onChange: (name: string, address: string, email: string, phone: string) => void;
  placeholder?: string;
}

export function ClientSelect({ value, onChange, placeholder }: ClientSelectProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  useEffect(() => {
    setLoading(true);
    fetch("/api/clients")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setClients(data);
        }
      })
      .catch(err => console.error("Failed to fetch clients", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (client: Client) => {
    onChange(client.name, client.address, client.email || "", client.phone || "");
    setSearchTerm(client.name);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setSearchTerm(newVal);
    onChange(newVal, "", "", ""); // Clear details if name is changed manually
    setIsOpen(true);
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Input
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="pr-10"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
          <Search className="w-4 h-4" />
        </div>
      </div>

      {isOpen && (searchTerm.length > 0 || (loading && clients.length === 0) || filteredClients.length > 0) && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
          {loading && clients.length === 0 ? (
            <div className="p-4 text-center">
              <div className="w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Loading Clients...</p>
            </div>
          ) : filteredClients.length > 0 ? (
            <div className="p-2 space-y-1">
              <p className="px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">Existing Clients</p>
              {filteredClients.map((client, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelect(client)}
                  className="w-full flex flex-col items-start px-3 py-2 rounded-lg hover:bg-brand-50 transition-colors text-left group"
                >
                  <div className="flex items-center gap-2 w-full">
                    <User className="w-4 h-4 text-slate-400 group-hover:text-brand-primary" />
                    <span className="font-bold text-slate-900 text-sm">{client.name}</span>
                  </div>
                  {client.address && (
                    <div className="flex items-start gap-2 mt-1 ml-6">
                      <MapPin className="w-3 h-3 text-slate-300 mt-0.5" />
                      <span className="text-xs text-slate-400 line-clamp-1">{client.address}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center">
              <p className="text-xs font-bold text-slate-500">No matching clients found</p>
              <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-tighter">Enter to use "{searchTerm}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
