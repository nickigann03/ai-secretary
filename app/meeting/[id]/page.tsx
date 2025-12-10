"use client";

import { use, useState, useEffect } from "react";
import { MeetingRecorder } from "@/components/MeetingRecorder";
import { MinutesEditor } from "@/components/MinutesEditor";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export default function MeetingPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const meetingId = id as Id<"meetings">;

    const meeting = useQuery(api.meetings.getMeeting, { meetingId });
    const members = useQuery(api.meetings.getMembers);
    const updateMeeting = useMutation(api.meetings.updateMeetingDetails);



    if (meeting === undefined) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (meeting === null) {
        return <div className="p-10">Meeting not found</div>;
    }

    const status = meeting.status;

    // handleStopRecording logic moved to MeetingRecorder.tsx
    // The view updates automatically based on status change.

    const toggleAttendance = (memberId: Id<"members">) => {
        const currentAttendance = meeting.attendance || [];
        const newAttendance = currentAttendance.includes(memberId)
            ? currentAttendance.filter(id => id !== memberId)
            : [...currentAttendance, memberId];

        updateMeeting({ meetingId, attendance: newAttendance });
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
                        <h1 className="text-xl font-bold text-slate-800">{meeting.title}</h1>
                        <p className="text-sm text-slate-500">
                            Status: <span className="font-semibold text-primary">{status}</span>
                        </p>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 container mx-auto p-6">

                {/* Attendance Section (Always visible) */}
                <details className="mb-8 bg-white p-4 rounded-lg border shadow-sm group">
                    <summary className="font-semibold text-slate-700 cursor-pointer list-none flex items-center justify-between">
                        <span>Attendance ({meeting.attendance?.length || 0} Present)</span>
                        <span className="text-sm text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {members?.map(member => (
                            <label key={member._id} className="flex items-center gap-2 p-2 rounded hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-100">
                                <input
                                    type="checkbox"
                                    checked={meeting.attendance?.includes(member._id) || false}
                                    onChange={() => toggleAttendance(member._id)}
                                    className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                                />
                                <span className="text-sm text-slate-700">{member.name} {member.role ? `(${member.role})` : ""}</span>
                            </label>
                        ))}
                        {(!members || members.length === 0) && <p className="text-sm text-slate-400 italic col-span-full">No members found. Add members to the database.</p>}
                    </div>
                    {/* Simple Add Member UI (Temporary) */}
                    <div className="mt-4 pt-4 border-t">
                        <AddMemberForm />
                    </div>
                </details>

                {/* Agenda Section */}
                <details className="mb-8 bg-white p-4 rounded-lg border shadow-sm group">
                    <summary className="font-semibold text-slate-700 cursor-pointer list-none flex items-center justify-between">
                        <span>Agenda & Context</span>
                        <span className="text-sm text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <div className="mt-4">
                        <p className="text-sm text-slate-500 mb-2">Paste the meeting agenda here to help the AI structure the minutes better.</p>
                        <textarea
                            className="w-full h-32 p-3 border rounded-md text-sm bg-slate-50 focus:ring-2 focus:ring-primary/20 outline-none"
                            placeholder="1. Call to Order&#10;2. Approval of Minutes&#10;3. ..."
                            defaultValue={meeting.agenda || ""}
                            onBlur={(e) => updateMeeting({ meetingId, agenda: e.target.value })}
                        />
                    </div>
                </details>

                {status === "RECORDING" && (
                    <MeetingRecorder meetingId={meetingId} />
                )}

                {(status === "PROCESSING_STT" || status === "PROCESSING_LLM") && (
                    <div className="flex flex-col items-center justify-center h-full pt-20">
                        <Loader2 className="h-16 w-16 text-primary animate-spin mb-6" />
                        <h2 className="text-2xl font-semibold text-slate-800 animate-pulse">Processing Meeting...</h2>
                        <p className="text-slate-500 mt-2">
                            {status === "PROCESSING_STT" ? "Transcribing audio..." : "Generating minutes..."}
                        </p>

                        <div className="mt-8 space-y-2 w-96">
                            <div className="w-full bg-slate-200 rounded-full h-2">
                                <div className="bg-primary h-2 rounded-full w-2/3 animate-[progress_2s_ease-in-out_infinite]" style={{ width: '60%' }}></div>
                            </div>
                        </div>
                    </div>
                )}

                {(status === "READY_FOR_REVIEW" || status === "FINALIZED") && (
                    <MinutesEditor
                        meetingId={meetingId}
                        transcript={meeting.rawTranscript || []}
                        initialMinutes={meeting.finalMinutes || []}
                    />
                )}
            </main>
        </div>
    );
}

function AddMemberForm() {
    const createMember = useMutation(api.meetings.createMember);
    const [name, setName] = useState("");
    const [role, setRole] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;
        await createMember({ name, role, email: "" });
        setName("");
        setRole("");
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-2 items-center">
            <input
                className="border rounded px-2 py-1 text-sm bg-slate-100 md:w-48"
                placeholder="New Member Name"
                value={name} onChange={e => setName(e.target.value)}
            />
            <input
                className="border rounded px-2 py-1 text-sm bg-slate-100 md:w-32"
                placeholder="Role (optional)"
                value={role} onChange={e => setRole(e.target.value)}
            />
            <Button type="submit" size="sm" variant="outline">Add</Button>
        </form>
    )
}
