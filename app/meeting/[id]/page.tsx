"use client";

import { useState } from "react";
import { MeetingRecorder } from "@/components/MeetingRecorder";
import { MinutesEditor } from "@/components/MinutesEditor";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type MeetingStatus = "RECORDING" | "PROCESSING" | "REVIEW";

export default function MeetingPage() {
    const [status, setStatus] = useState<MeetingStatus>("RECORDING");

    const handleStopRecording = () => {
        setStatus("PROCESSING");
        // Simulate AI Latency
        setTimeout(() => {
            setStatus("REVIEW");
        }, 4000); // 4 seconds delay to feel "real"
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 py-4 px-6 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Link href="/">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5 text-slate-500" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">December Monthly Meeting</h1>
                        <p className="text-sm text-slate-500">
                            Status: <span className="font-semibold text-primary">{status}</span>
                        </p>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 container mx-auto p-6">
                {status === "RECORDING" && (
                    <MeetingRecorder onStop={handleStopRecording} />
                )}

                {status === "PROCESSING" && (
                    <div className="flex flex-col items-center justify-center h-full pt-20">
                        <Loader2 className="h-16 w-16 text-primary animate-spin mb-6" />
                        <h2 className="text-2xl font-semibold text-slate-800 animate-pulse">Processing Audio with Gladia AI...</h2>
                        <p className="text-slate-500 mt-2">Diarizing speakers and extracting minutes...</p>

                        <div className="mt-8 space-y-2 w-96">
                            <div className="w-full bg-slate-200 rounded-full h-2">
                                <div className="bg-primary h-2 rounded-full w-2/3 animate-[progress_2s_ease-in-out_infinite]" style={{ width: '60%' }}></div>
                            </div>
                            <p className="text-xs text-center text-slate-400">Step 2 of 3: AI Structuring</p>
                        </div>
                    </div>
                )}

                {status === "REVIEW" && (
                    <MinutesEditor />
                )}
            </main>
        </div>
    );
}
