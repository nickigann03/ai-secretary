"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2, CheckCircle, Pause, Sparkles, AlertCircle } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

/**
 * Renders a recorder UI that captures microphone audio, auto-saves when stopped,
 * and allows generating AI minutes separately.
 *
 * @param meetingId - The meeting identifier to associate the uploaded audio with
 * @returns The MeetingRecorder React element
 */
export function MeetingRecorder({ meetingId }: { meetingId: Id<"meetings"> }) {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [duration, setDuration] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [audioPreview, setAudioPreview] = useState<string | null>(null);
    const [savedAudioUrl, setSavedAudioUrl] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const pendingBlobRef = useRef<Blob | null>(null);

    const generateUploadUrl = useMutation(api.meetings.generateUploadUrl);
    const saveMeetingAudio = useMutation(api.meetings.saveMeetingAudio);
    const generateMeetingMinutes = useMutation(api.meetings.generateMeetingMinutes);

    // Cleanup blob url
    useEffect(() => {
        return () => {
            if (audioPreview) URL.revokeObjectURL(audioPreview);
        };
    }, [audioPreview]);

    // Auto-save function
    const autoSaveRecording = useCallback(async (blob: Blob) => {
        setIsUploading(true);
        setSaveError(null);

        try {
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

            // 3. Save to meeting (without triggering AI)
            const { audioUrl } = await saveMeetingAudio({ meetingId, storageId });
            setSavedAudioUrl(audioUrl);
            setIsSaved(true);
            setIsUploading(false);

        } catch (error) {
            console.error("Auto-save failed", error);
            setSaveError("Failed to save recording. Please try again.");
            setIsUploading(false);
        }
    }, [generateUploadUrl, meetingId, saveMeetingAudio]);

    const startRecording = async () => {
        try {
            if (typeof window === "undefined" || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                alert("Audio recording is not supported in this browser or environment.");
                return;
            }
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            chunksRef.current = [];
            setSaveError(null);
            setIsSaved(false);
            setSavedAudioUrl(null);

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);
                setAudioPreview(url);
                pendingBlobRef.current = blob;
                stream.getTracks().forEach(track => track.stop());

                // AUTO-SAVE immediately when recording stops!
                autoSaveRecording(blob);
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
        const startTime = Date.now() - (duration * 1000);
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

    const handleGenerateMinutes = async () => {
        if (!isSaved) return;
        setIsGenerating(true);

        try {
            await generateMeetingMinutes({ meetingId });
            // After triggering, the meeting status will update through Convex reactivity
        } catch (error) {
            console.error("Generate minutes failed", error);
            alert("Failed to generate minutes. Please try again.");
            setIsGenerating(false);
        }
    };

    const handleRetry = async () => {
        if (pendingBlobRef.current) {
            await autoSaveRecording(pendingBlobRef.current);
        }
    };

    const handleDiscard = () => {
        if (confirm("Are you sure you want to discard this recording?")) {
            setAudioPreview(null);
            setDuration(0);
            chunksRef.current = [];
            pendingBlobRef.current = null;
            setIsSaved(false);
            setSavedAudioUrl(null);
            setSaveError(null);
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
                    ) : isGenerating ? (
                        <Sparkles className="h-20 w-20 text-purple-500 animate-pulse" />
                    ) : saveError ? (
                        <AlertCircle className="h-20 w-20 text-red-500" />
                    ) : isSaved ? (
                        <CheckCircle className="h-20 w-20 text-green-500" />
                    ) : audioPreview ? (
                        <Loader2 className="h-20 w-20 text-primary animate-spin" />
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
                    {isUploading ? "Saving Recording..." :
                        isGenerating ? "Generating AI Minutes..." :
                            saveError ? "Save Failed" :
                                isPaused ? "Recording Paused" :
                                    isRecording ? "Recording Live" :
                                        isSaved ? "Recording Saved ✓" :
                                            audioPreview ? "Saving..." : "Ready to Record"}
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

                {/* SAVING STATE - Show while auto-save is in progress */}
                {audioPreview && isUploading && (
                    <div className="space-y-4 w-full max-w-md text-center">
                        <p className="text-slate-600">Your recording is being saved automatically...</p>
                        <audio src={audioPreview} controls className="w-full" />
                    </div>
                )}

                {/* SAVE ERROR STATE */}
                {audioPreview && saveError && !isUploading && (
                    <div className="space-y-6 w-full max-w-md">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                            <p className="text-red-700 font-medium">{saveError}</p>
                        </div>
                        <audio src={audioPreview} controls className="w-full" />
                        <div className="flex gap-3 justify-center w-full">
                            <Button size="lg" variant="outline" onClick={handleDiscard} className="px-6 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
                                Discard
                            </Button>
                            <Button size="lg" className="px-8 bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-md flex-1" onClick={handleRetry}>
                                <Loader2 className="h-5 w-5" /> Retry Save
                            </Button>
                        </div>
                    </div>
                )}

                {/* SAVED STATE - Recording saved, can generate minutes */}
                {audioPreview && isSaved && !isUploading && !isGenerating && (
                    <div className="space-y-6 w-full max-w-md">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                            <p className="text-green-700 font-medium">✓ Recording saved successfully!</p>
                            <p className="text-green-600 text-sm mt-1">You can safely leave this page. Generate AI minutes whenever you&apos;re ready.</p>
                        </div>
                        <audio src={audioPreview} controls className="w-full" />

                        <div className="flex gap-3 justify-center w-full">
                            <Button size="lg" variant="outline" onClick={handleDiscard} className="px-6 border-slate-200 text-slate-600 hover:bg-slate-50">
                                Discard & Retake
                            </Button>
                            <Button size="lg" className="px-8 bg-purple-600 hover:bg-purple-700 text-white gap-2 shadow-md flex-1" onClick={handleGenerateMinutes}>
                                <Sparkles className="h-5 w-5" /> Generate AI Minutes
                            </Button>
                        </div>
                    </div>
                )}

                {/* GENERATING STATE */}
                {isGenerating && (
                    <div className="space-y-4 w-full max-w-md text-center">
                        <p className="text-slate-600">AI is processing your recording...</p>
                        <p className="text-slate-500 text-sm">This may take a few minutes depending on the length.</p>
                        {audioPreview && <audio src={audioPreview} controls className="w-full" />}
                    </div>
                )}
            </div>
        </div>
    );
}