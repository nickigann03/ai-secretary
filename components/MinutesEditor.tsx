"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Save, Download, FileText, CheckCircle, Loader2 } from "lucide-react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export interface MinutesEditorProps {
    meetingId: Id<"meetings">;
    transcript: { speaker: string; text: string; time: number }[];
    initialMinutes: { item: string; description: string; remark: string }[];
}

export function MinutesEditor({ meetingId, transcript, initialMinutes }: MinutesEditorProps) {
    const meeting = useQuery(api.meetings.getMeeting, { meetingId });

    const [minutes, setMinutes] = useState(initialMinutes.map((m, i) => ({
        id: i,
        item: m.item,
        title: "", // Simplification as discussed
        description: m.description,
        remark: m.remark
    })));
    const [isExporting, setIsExporting] = useState(false);
    const [statusDialog, setStatusDialog] = useState<{ isOpen: boolean, title: string, message: string }>({
        isOpen: false, title: "", message: ""
    });

    const updateMinutes = useMutation(api.meetings.updateMinutes);
    const exportMinutes = useAction(api.actions.exportMinutes);

    const handleUpdate = (id: number, field: string, value: string) => {
        setMinutes(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
    };

    const saveData = async () => {
        // Map UI state back to schema
        const schemaMinutes = minutes.map(m => ({
            item: m.item,
            description: m.description, // Collapsing title into description or ignoring it for now
            remark: m.remark
        }));

        await updateMinutes({
            meetingId,
            minutes: schemaMinutes,
            status: "READY_FOR_REVIEW" // Keep in review or move to finalized?
        });
    };

    const handleSaveClick = async () => {
        await saveData();
        setStatusDialog({ isOpen: true, title: "Draft Saved", message: "Meeting minutes have been updated successfully." });
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            // First save recent changes (silent)
            await saveData();

            // Call backend to generate DOCX
            const base64 = await exportMinutes({ meetingId });

            // Download Blob
            const binaryString = window.atob(base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
            const link = document.createElement("a");
            link.href = window.URL.createObjectURL(blob);
            link.download = `Lions_Minutes_${new Date().toISOString().slice(0, 10)}.docx`;
            link.click();

            setStatusDialog({ isOpen: true, title: "Export Complete", message: "Your minutes document has been downloaded." });

        } catch (error) {
            console.error("Export failed", error);
            setStatusDialog({ isOpen: true, title: "Export Failed", message: "Could not generate or download the document." });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-100px)] gap-6">
            {/* Left Pane: Transcript Scanner */}
            <div className="w-1/3 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b bg-slate-50 space-y-3">
                    <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Transcript Source
                    </h3>
                    {meeting?.audioFileUrl && (
                        <div className="bg-slate-100 p-2 rounded-md">
                            <audio src={meeting.audioFileUrl} controls className="w-full h-8" />
                        </div>
                    )}
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {transcript.map((line, idx) => (
                        <div key={idx} className="bg-slate-50 p-3 rounded-lg text-sm border hover:border-primary/30 transition-colors cursor-pointer group">
                            <div className="flex justify-between mb-1">
                                <span className="font-semibold text-primary/80 text-xs uppercase tracking-wider">{line.speaker}</span>
                                <span className="text-slate-400 text-xs font-mono">{line.time}</span>
                            </div>
                            <p className="text-slate-700 group-hover:text-slate-900">{line.text}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Pane: Minutes Editor */}
            <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-700">Lions Club Minutes Template</h3>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="gap-2" onClick={handleSaveClick}>
                            <Save className="h-4 w-4" /> Save Draft
                        </Button>
                        <Button size="sm" className="gap-2 bg-green-600 hover:bg-green-700 text-white" onClick={handleExport} disabled={isExporting}>
                            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                            {isExporting ? "Exporting..." : "Export to DOCX"}
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                    <div className="max-w-4xl mx-auto space-y-6">
                        {minutes.map((item) => (
                            <Card key={item.id} className="border-slate-200 shadow-sm overflow-hidden">
                                <div className="flex">
                                    {/* Item Number Column */}
                                    <div className="w-24 bg-slate-100 p-4 border-r flex flex-col items-center justify-center text-center">
                                        <span className="text-lg font-bold text-slate-500">{item.item}</span>
                                    </div>

                                    {/* Description Column */}
                                    <div className="flex-1 p-4 border-r">
                                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                                            Description / Discussion / Decision
                                        </label>
                                        <Input
                                            className="mb-2 font-semibold border-none px-0 h-auto focus-visible:ring-0 text-slate-800 text-lg"
                                            value={item.title}
                                            placeholder="Title (Optional)"
                                            onChange={(e) => handleUpdate(item.id, "title", e.target.value)}
                                        />
                                        <Textarea
                                            className="border-slate-200 resize-none min-h-[100px] text-base"
                                            value={item.description}
                                            onChange={(e) => handleUpdate(item.id, "description", e.target.value)}
                                        />
                                    </div>

                                    {/* Remark/Action Column */}
                                    <div className="w-64 p-4 bg-slate-50/50">
                                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                                            Remark / Action By
                                        </label>
                                        <div className="relative">
                                            <Input
                                                className={`border-slate-200 ${item.remark === "Info" ? "text-slate-500 italic" : "text-red-600 font-semibold bg-red-50"}`}
                                                value={item.remark}
                                                onChange={(e) => handleUpdate(item.id, "remark", e.target.value)}
                                            />
                                            {item.remark !== "Info" && (
                                                <div className="absolute right-2 top-2.5">
                                                    <CheckCircle className="h-4 w-4 text-red-500" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>

            <StatusDialog
                isOpen={statusDialog.isOpen}
                title={statusDialog.title}
                message={statusDialog.message}
                onClose={() => setStatusDialog(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
}

function StatusDialog({ isOpen, onClose, title, message }: { isOpen: boolean; onClose: () => void; title: string; message: string }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
                <div className="flex flex-col items-center text-center">
                    <div className="bg-green-100 p-3 rounded-full mb-4">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-slate-800">{title}</h3>
                    <p className="text-slate-600 mb-6">{message}</p>
                    <Button className="w-full" onClick={onClose}>OK</Button>
                </div>
            </div>
        </div>
    );
}

