"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, Square, Loader2, CheckCircle, Pause } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export function MeetingRecorder({ meetingId }: { meetingId: Id<"meetings"> }) {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [duration, setDuration] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [audioPreview, setAudioPreview] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const generateUploadUrl = useMutation(api.meetings.generateUploadUrl);
    const updateMeetingAudio = useMutation(api.meetings.updateMeetingAudio);

    // Cleanup blob url
    useEffect(() => {
        return () => {
            if (audioPreview) URL.revokeObjectURL(audioPreview);
        };
    }, [audioPreview]);

    const startRecording = async () => {
        try {
            if (typeof window === "undefined" || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                alert("Audio recording is not supported in this browser or environment.");
                return;
            }
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);
                setAudioPreview(url);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start(1000);
            setIsRecording(true);
            setIsPaused(false);
            startTimer();
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone.");
        }
    };

    const startTimer = () => {
        const startTime = Date.now() - (duration * 1000); // Adjust for existing duration
        timerRef.current = setInterval(() => {
            setDuration(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);
    };

    const stopTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const pauseRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.pause();
            setIsPaused(true);
            stopTimer();
        }
    };

    const resumeRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.resume();
            setIsPaused(false);
            startTimer();
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsPaused(false);
            stopTimer();
        }
    };

    const handleProcess = async () => {
        if (!audioPreview) return;
        setIsUploading(true);

        try {
            // Re-create blob from chunks matching preview
            const blob = await fetch(audioPreview).then(r => r.blob());

            // 1. Get Upload URL
            const postUrl = await generateUploadUrl();

            // 2. Upload
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": "audio/webm" },
                body: blob,
            });
            if (!result.ok) throw new Error("Upload failed");

            const { storageId } = await result.json();

            // 3. Update Meeting
            await updateMeetingAudio({ meetingId, storageId });

        } catch (error) {
            console.error("Upload failed", error);
            setIsUploading(false);
            alert("Failed to upload recording.");
        }
    };

    const handleDiscard = () => {
        if (confirm("Are you sure you want to discard this recording?")) {
            setAudioPreview(null);
            setDuration(0);
            chunksRef.current = [];
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col items-center justify-center h-full gap-8 py-10">
            {/* Visualizer / Status Area */}
            <div className="relative w-64 h-64 flex items-center justify-center">
                {(isRecording && !isPaused) && (
                    <>
                        <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping"></div>
                        <div className="absolute inset-4 rounded-full border-4 border-primary/40 animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                    </>
                )}

                <div className={`relative z-10 bg-white p-6 rounded-full shadow-xl transition-all ${isPaused ? 'border-4 border-amber-400' : ''}`}>
                    {isUploading ? (
                        <Loader2 className="h-20 w-20 text-primary animate-spin" />
                    ) : audioPreview ? (
                        <CheckCircle className="h-20 w-20 text-green-500" />
                    ) : (
                        <Mic className={`h-20 w-20 ${isRecording ? (isPaused ? 'text-amber-500' : 'text-red-500 animate-pulse') : 'text-slate-400'}`} />
                    )}
                </div>
            </div>

            {/* Timer Display */}
            <div className="text-center space-y-2">
                <h2 className={`text-4xl font-mono font-bold ${isRecording ? 'text-slate-800' : 'text-slate-400'}`}>
                    {formatTime(duration)}
                </h2>
                <p className="text-slate-500 font-medium tracking-wide uppercase text-sm">
                    {isUploading ? "Uploading & Processing..." :
                        isPaused ? "Recording Paused" :
                            isRecording ? "Recording Live" :
                                audioPreview ? "Recording Complete" : "Ready to Record"}
                </p>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-4 items-center">

                {/* IDLE STATE */}
                {!isRecording && !audioPreview && !isUploading && (
                    <Button size="lg" className="h-16 px-10 rounded-full text-xl shadow-lg hover:scale-105 transition-transform" onClick={startRecording}>
                        Start Recording
                    </Button>
                )}

                {/* RECORDING STATE */}
                {isRecording && (
                    <div className="flex gap-4">
                        {isPaused ? (
                            <Button size="lg" variant="outline" className="h-14 w-14 rounded-full border-2 border-slate-300" onClick={resumeRecording} title="Resume">
                                <Mic className="h-5 w-5 text-slate-700" />
                            </Button>
                        ) : (
                            <Button size="lg" variant="outline" className="h-14 w-14 rounded-full border-2 border-amber-200 hover:bg-amber-50 text-amber-600" onClick={pauseRecording} title="Pause">
                                <Pause className="h-6 w-6" />
                            </Button>
                        )}

                        <Button size="lg" variant="destructive" className="h-14 px-8 rounded-full text-lg shadow-lg gap-2" onClick={stopRecording}>
                            <Square className="h-5 w-5 fill-current" /> Stop
                        </Button>
                    </div>
                )}

                {/* REVIEW STATE */}
                {audioPreview && !isUploading && (
                    <div className="space-y-6 w-full max-w-md">
                        <audio src={audioPreview} controls className="w-full" />

                        <div className="flex gap-3 justify-center w-full">
                            <Button size="lg" variant="outline" onClick={handleDiscard} className="px-6 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
                                Discard & Retake
                            </Button>
                            <Button size="lg" className="px-8 bg-green-600 hover:bg-green-700 text-white gap-2 shadow-md flex-1" onClick={handleProcess}>
                                <CheckCircle className="h-5 w-5" /> Save & Generate Minutes
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
