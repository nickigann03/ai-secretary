"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Save, Download, FileText, CheckCircle } from "lucide-react";

// Mock Transcript Data
const MOCK_TRANSCRIPT = [
    { speaker: "President Lion Mary", text: "I call this meeting to order at 8:00 PM.", time: "00:00" },
    { speaker: "Lion John (Secretary)", text: "Apologies have been received from Lion ET and Lion Sarah.", time: "00:15" },
    { speaker: "President Lion Mary", text: "Thank you. Let's move to the confirmation of previous minutes.", time: "00:30" },
    { speaker: "Lion ET", text: "I propose we accept the minutes as read.", time: "00:45" },
    { speaker: "Lion EY", text: "I second that motion.", time: "00:50" },
    { speaker: "President Lion Mary", text: "Minutes confirmed. Any matters arising?", time: "01:00" },
];

// Mock Initial Minutes Data (AI Generated)
const INITIAL_MINUTES = [
    { id: 1, item: "1.0", title: "Call to Order", description: "The meeting was called to order by President Lion Mary at 8:00 PM.", remark: "Info" },
    { id: 2, item: "2.0", title: "Apologies", description: "Apologies received from Lion ET and Lion Sarah.", remark: "Info" },
    { id: 3, item: "3.0", title: "Confirmation of Minutes", description: "The minutes of the previous meeting were confirmed. Proposed by Lion ET, Seconded by Lion EY.", remark: "Info" },
    { id: 4, item: "4.0", title: "Matters Arising", description: "No matters arising were discussed.", remark: "Info" },
];

export function MinutesEditor() {
    const [minutes, setMinutes] = useState(INITIAL_MINUTES);

    const handleUpdate = (id: number, field: string, value: string) => {
        setMinutes(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
    };

    const handleExport = () => {
        alert("Generating .docx file... (This would trigger the backend export)");
    };

    return (
        <div className="flex h-[calc(100vh-100px)] gap-6">
            {/* Left Pane: Transcript Scanner */}
            <div className="w-1/3 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b bg-slate-50">
                    <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Transcript Source
                    </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {MOCK_TRANSCRIPT.map((line, idx) => (
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
                        <Button variant="outline" size="sm" className="gap-2">
                            <Save className="h-4 w-4" /> Save Draft
                        </Button>
                        <Button size="sm" className="gap-2 bg-green-600 hover:bg-green-700 text-white" onClick={handleExport}>
                            <Download className="h-4 w-4" /> Export to DOCX
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
        </div>
    );
}
