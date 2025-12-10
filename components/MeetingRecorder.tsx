"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, Square, Loader2 } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export function MeetingRecorder({ meetingId }: { meetingId: Id<"meetings"> }) {
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const generateUploadUrl = useMutation(api.meetings.generateUploadUrl);
    const updateMeetingAudio = useMutation(api.meetings.updateMeetingAudio);

    // Initializer to request permissions
    useEffect(() => {
        // We could request permissions here, or wait for user to click record.
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const startRecording = async () => {
        try {
            if (typeof window === "undefined" || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                alert("Audio recording is not supported in this browser or environment (check if HTTPS or localhost).");
                return;
            }
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' }); // Chrome/Edge default
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                handleUpload();
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start(1000); // Collect chunks every second
            setIsRecording(true);

            // Start Timer
            const startTime = Date.now();
            timerRef.current = setInterval(() => {
                setDuration(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);

        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone. Please allow permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const handleUpload = async () => {
        setIsUploading(true);
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });

        try {
            // 1. Get Upload URL
            const postUrl = await generateUploadUrl();

            // 2. Upload File to Convex Storage
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": "audio/webm" },
                body: blob,
            });
            const { storageId } = await result.json();

            // 3. Update Meeting Record
            await updateMeetingAudio({ meetingId, storageId });

            // UI will naturally update because useQuery in parent sees status change to 'PROCESSING_STT'

        } catch (error) {
            console.error("Upload failed", error);
            setIsUploading(false);
            alert("Failed to upload recording.");
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col items-center justify-center h-full gap-8 py-10">
            {/* Visualizer Area (Mock Visuals for now) */}
            <div className="relative w-64 h-64 flex items-center justify-center">
                <div className={`absolute inset-0 rounded-full border-4 border-primary/20 ${isRecording ? 'animate-ping' : ''}`}></div>
                <div className={`absolute inset-4 rounded-full border-4 border-primary/40 ${isRecording ? 'animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]' : ''}`}></div>
                <div className="relative z-10 bg-white p-6 rounded-full shadow-xl">
                    {isUploading ? (
                        <Loader2 className="h-20 w-20 text-primary animate-spin" />
                    ) : (
                        <Mic className={`h-20 w-20 ${isRecording ? 'text-red-500 animate-pulse' : 'text-slate-400'}`} />
                    )}
                </div>
            </div>

            {/* Status & Timer */}
            <div className="text-center space-y-2">
                <h2 className={`text-3xl font-mono font-bold ${isRecording ? 'text-slate-800' : 'text-slate-400'}`}>
                    {formatTime(duration)}
                </h2>
                <p className="text-slate-500 font-medium tracking-wide">
                    {isUploading ? "Uploading Audio..." : isRecording ? "RECORDING IN PROGRESS" : "Ready to Record"}
                </p>
            </div>

            {/* Controls */}
            <div className="flex gap-4">
                {!isRecording && !isUploading && (
                    <Button
                        size="lg"
                        className="h-14 px-8 rounded-full text-lg shadow-lg"
                        onClick={startRecording}
                    >
                        Start Recording
                    </Button>
                )}

                {isRecording && (
                    <Button
                        size="lg"
                        variant="destructive"
                        className="h-14 px-8 rounded-full text-lg shadow-lg gap-2"
                        onClick={stopRecording}
                    >
                        <Square className="h-5 w-5 fill-current" />
                        Stop & Process
                    </Button>
                )}
            </div>

            {/* Live Transcript Preview (Simulated Feedback) */}
            {isRecording && (
                <Card className="w-full max-w-2xl mt-8 p-4 bg-slate-50/50 border-dashed border-2">
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold uppercase mb-2">
                        <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
                        Live Transcript Preview
                    </div>
                    <p className="text-slate-600 italic">
                        [Listening...]
                    </p>
                </Card>
            )}
        </div>
    );
}
