"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";

interface User {
    id: string;
    username: string;
    role: string;
    email: string;
    mobile: string;
    createdAt?: string;
}

import { Trash2 } from "lucide-react";

interface UserManagementSectionProps {
    currentUser?: string;
}

export const UserManagementSection = ({ currentUser }: UserManagementSectionProps) => {
    const [users, setUsers] = useState<User[]>([]);
    const [newUser, setNewUser] = useState({ 
        username: "", password: "", repeatPassword: "", role: "user", email: "", mobile: "" 
    });

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/users/list");
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
        }
    };

    React.useEffect(() => {
        fetchUsers();
    }, []);

    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);

    // Check if role defaults to admin if not set
    const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setNewUser({ ...newUser, role: e.target.value });
    };

    const handleDelete = async (user: User) => {
        if (!confirm(`Are you sure you want to delete user ${user.username}?`)) return;
        
        setDeleting(user.id);
        try {
            const res = await fetch("/api/users", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: user.id })
            });

            const data = await res.json();
            
            if (res.ok) {
                toast.success(`User ${user.username} deleted`);
                fetchUsers();
            } else {
                toast.error(data.error || "Failed to delete user");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setDeleting(null);
        }
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
                    role: newUser.role,
                    email: newUser.email,
                    mobile: newUser.mobile
                })
            });

            const data = await res.json();
            
            if (res.ok) {
                toast.success(`User ${newUser.username} created successfully!`);
                setNewUser({ username: "", password: "", repeatPassword: "", role: "user", email: "", mobile: "" });
                fetchUsers();
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
                        <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Email</label>
                        <input 
                            type="email"
                            value={newUser.email}
                            onChange={e => setNewUser({...newUser, email: e.target.value})}
                            className="w-full h-11 rounded-xl bg-slate-50 border border-slate-200 px-4 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                            placeholder="e.g. user@example.com"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Mobile</label>
                        <input 
                            type="tel"
                            value={newUser.mobile}
                            onChange={e => setNewUser({...newUser, mobile: e.target.value})}
                            className="w-full h-11 rounded-xl bg-slate-50 border border-slate-200 px-4 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                            placeholder="Mobile Number"
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
                        disabled={loading}
                        className={`px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl shadow-lg shadow-slate-900/20 hover:bg-slate-800 active:scale-95 transition-all ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? "Creating..." : "Create User"}
                    </button>
                 </div>
            </form>

            <div className="mt-12">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Existing Users</h3>
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                    <table className="w-full text-left border-collapse bg-white">
                        <thead className="sticky top-0 bg-white z-10 shadow-sm">
                            <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                <th className="py-3 px-2 bg-white">Username</th>
                                <th className="py-3 px-2 bg-white">Role</th>
                                <th className="py-3 px-2 bg-white">Email</th>
                                <th className="py-3 px-2 bg-white">Created At</th>
                                <th className="py-3 px-2 bg-white text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-slate-700">
                            {users.map(user => (
                                <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                    <td className="py-3 px-2 font-medium">{user.username}</td>
                                    <td className="py-3 px-2">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                                            user.role === 'admin' ? 'bg-purple-50 text-purple-700 ring-1 ring-purple-600/10' : 'bg-slate-100 text-slate-600 ring-1 ring-slate-500/10'
                                        }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="py-3 px-2 text-slate-500">{user.email || "-"}</td>
                                    <td className="py-3 px-2 text-slate-400 text-xs">
                                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
                                    </td>
                                    <td className="py-3 px-2 text-right">
                                        {user.username === currentUser ? (
                                            <span className="text-xs font-medium text-slate-400 italic pr-2">You</span>
                                        ) : (
                                            <button 
                                                onClick={() => handleDelete(user)}
                                                disabled={deleting !== null}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Delete User"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-slate-400">
                                        No users found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
};
