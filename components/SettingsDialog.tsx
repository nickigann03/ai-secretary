"use client";

import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Trash, Plus, User, Activity } from "lucide-react";
import { Id } from "../convex/_generated/dataModel";

export function SettingsDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-[80vh] flex flex-col animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b flex justify-between items-center bg-slate-50 rounded-t-lg">
                    <h2 className="text-xl font-bold text-slate-800">Settings</h2>
                    <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
                </div>

                <div className="flex-1 overflow-auto p-6 space-y-8">
                    <ConnectionTester />
                    <hr className="border-slate-100" />
                    <MembersManager />
                </div>
            </div>
        </div>
    );
}

function ConnectionTester() {
    const testConnection = useAction(api.actions.testApiConnections);
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const runTest = async () => {
        setLoading(true);
        try {
            const res = await testConnection();
            setStatus(res);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    System Status
                </h3>
                <Button onClick={runTest} disabled={loading} size="sm" variant="outline">
                    {loading ? "Checking..." : "Test API Connections"}
                </Button>
            </div>

            {status && (
                <div className="grid grid-cols-2 gap-4">
                    <div className={`p-3 rounded border ${status.gladia.status === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                        <div className="font-bold mb-1">Gladia (Speech-to-Text)</div>
                        <div className="text-xs">{status.gladia.message}</div>
                    </div>
                    <div className={`p-3 rounded border ${status.gemini.status === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                        <div className="font-bold mb-1">Gemini (AI Minutes)</div>
                        <div className="text-xs">{status.gemini.message}</div>
                    </div>
                </div>
            )}
        </div>
    )
}

function MembersManager() {
    const members = useQuery(api.meetings.getMembers);
    const createMember = useMutation(api.meetings.createMember);
    const deleteMember = useMutation(api.meetings.deleteMember);

    const [newName, setNewName] = useState("");
    const [newRole, setNewRole] = useState("");

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName) return;
        await createMember({ name: newName, role: newRole, email: "" });
        setNewName("");
        setNewRole("");
    };

    const handleDelete = async (id: Id<"members">) => {
        if (confirm("Remove this member? This won't affect past minutes.")) {
            await deleteMember({ memberId: id });
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Club Members
                </h3>
                <p className="text-sm text-slate-500 mb-4">Manage the roster for attendance taking.</p>

                {/* Add Form */}
                <form onSubmit={handleAdd} className="flex gap-2 mb-6 bg-slate-50 p-4 rounded-lg border">
                    <input
                        className="flex-1 border rounded px-3 py-2 text-sm"
                        placeholder="Member Name (e.g., Lion John Doe)"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                    />
                    <input
                        className="w-1/3 border rounded px-3 py-2 text-sm"
                        placeholder="Role (e.g., Treasurer)"
                        value={newRole}
                        onChange={e => setNewRole(e.target.value)}
                    />
                    <Button type="submit" size="sm" className="gap-2">
                        <Plus className="h-4 w-4" /> Add
                    </Button>
                </form>

                {/* List */}
                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-100 text-slate-600 font-medium">
                            <tr>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Role</th>
                                <th className="px-4 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {!members ? (
                                <tr><td colSpan={3} className="p-4 text-center text-slate-400">Loading...</td></tr>
                            ) : members.length === 0 ? (
                                <tr><td colSpan={3} className="p-8 text-center text-slate-400">No members yet. Add one above!</td></tr>
                            ) : (
                                members.map(m => (
                                    <tr key={m._id} className="hover:bg-slate-50 group">
                                        <td className="px-4 py-3 font-medium text-slate-800">{m.name}</td>
                                        <td className="px-4 py-3 text-slate-600">{m.role}</td>
                                        <td className="px-4 py-3 text-right">
                                            <Button
                                                size="sm" variant="ghost"
                                                onClick={() => handleDelete(m._id)}
                                                className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
