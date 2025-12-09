"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StopCircle, Mic } from "lucide-react";

export function MeetingRecorder({ onStop }: { onStop: () => void }) {
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setDuration((prev) => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds: number) => {
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
    };

    return (
        <div className="flex flex-col items-center justify-center p-12">
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20"></div>
                <div className="relative bg-red-50 rounded-full p-8 border-4 border-red-100">
                    <Mic className="h-12 w-12 text-red-600" />
                </div>
            </div>

            <h2 className="text-3xl font-bold text-slate-800 mb-2 tracking-tight">Recording in Progress</h2>
            <p className="text-slate-500 mb-8">Lions Club of KL Vision City - Monthly Meeting</p>

            <div className="text-6xl font-mono font-medium text-slate-900 mb-8 tabular-nums">
                {formatTime(duration)}
            </div>

            {/* Abstract Visualizer */}
            <div className="flex gap-1 h-12 items-center justify-center mb-8 w-full max-w-md">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="w-1.5 bg-slate-300 rounded-full animate-pulse"
                        style={{
                            height: `${Math.random() * 100}%`,
                            animationDelay: `${i * 0.1}s`,
                            animationDuration: '0.8s'
                        }}
                    />
                ))}
            </div>

            {/* Live Transcript Simulation */}
            <Card className="w-full max-w-2xl mb-8 border-slate-200 bg-white/80 backdrop-blur">
                <div className="p-4 h-32 overflow-hidden relative">
                    <div className="absolute top-2 right-2 flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-semibold text-red-500 uppercase tracking-widest">Live Transcript</span>
                    </div>
                    <div className="space-y-2 opacity-70 mask-image-linear-to-b">
                        <p className="text-sm text-slate-400">Speaker 1: ...calling the meeting to order...</p>
                        <p className="text-sm text-slate-400">Speaker 2: ...apologies from Lion John...</p>
                        <p className="text-sm text-slate-800 font-medium">Speaker 1: Thank you, let's proceed to the minutes...</p>
                    </div>
                </div>
            </Card>

            <Button
                size="lg"
                variant="destructive"
                className="rounded-full px-12 py-8 text-xl h-auto shadow-xl hover:scale-105 transition-transform"
                onClick={onStop}
            >
                <StopCircle className="mr-3 h-8 w-8" />
                Stop & Process
            </Button>
        </div>
    );
}
