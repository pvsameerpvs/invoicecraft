"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";

export const UserManagementSection = () => {
    const [newUser, setNewUser] = useState({ 
        username: "", password: "", repeatPassword: "", role: "user" 
    });

    const [loading, setLoading] = useState(false);
    
    // Check if role defaults to admin if not set
    const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setNewUser({ ...newUser, role: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newUser.password !== newUser.repeatPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: newUser.username,
                    password: newUser.password,
                    role: newUser.role
                })
            });

            const data = await res.json();
            
            if (res.ok) {
                toast.success(`User ${newUser.username} created successfully!`);
                setNewUser({ username: "", password: "", repeatPassword: "", role: "user" });
            } else {
                toast.error(data.error || "Failed to create user");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="bg-white rounded-3xl p-8 shadow-sm ring-1 ring-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-900">Create New User</h2>
                <p className="text-sm text-slate-400">Add a new user to the system.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Username</label>
                        <input 
                            required
                            value={newUser.username}
                            onChange={e => setNewUser({...newUser, username: e.target.value})}
                            className="w-full h-11 rounded-xl bg-slate-50 border border-slate-200 px-4 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                            placeholder="e.g. johndoe"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Role</label>
                        <select 
                            value={newUser.role}
                            onChange={e => setNewUser({...newUser, role: e.target.value})}
                            className="w-full h-11 rounded-xl bg-slate-50 border border-slate-200 px-4 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                        >
                            <option value="user">Standard User</option>
                            <option value="admin">Administrator</option>
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Password</label>
                        <input 
                            required
                            type="password"
                            value={newUser.password}
                            onChange={e => setNewUser({...newUser, password: e.target.value})}
                            className="w-full h-11 rounded-xl bg-slate-50 border border-slate-200 px-4 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                            placeholder="••••••••"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Repeat Password</label>
                        <input 
                            required
                            type="password"
                            value={newUser.repeatPassword}
                            onChange={e => setNewUser({...newUser, repeatPassword: e.target.value})}
                            className="w-full h-11 rounded-xl bg-slate-50 border border-slate-200 px-4 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                            placeholder="••••••••"
                        />
                    </div>
                 </div>

                 <div className="flex justify-end pt-4 border-t border-slate-100">
                    <button 
                        type="submit"
                        className="px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl shadow-lg shadow-slate-900/20 hover:bg-slate-800 active:scale-95 transition-all"
                    >
                        Create User
                    </button>
                 </div>
            </form>
        </section>
    );
};
