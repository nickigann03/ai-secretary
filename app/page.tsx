"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, FileText, Calendar, Plus, Settings, Loader2, MapPin, Pencil, Trash } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SettingsDialog } from "@/components/SettingsDialog";
import Image from "next/image";

/**
 * Render the main Dashboard UI for managing meetings, folders, and related actions.
 *
 * Wires data queries and mutations, local UI state, and action handlers used by the dashboard, and renders header, action controls, folder-based and year-based meeting groupings, settings, and edit dialogs.
 *
 * @returns The rendered dashboard JSX element containing header, actions, folder/year groupings, settings dialog, and the edit meeting dialog when active.
 */
export default function Dashboard() {
  const router = useRouter();
  // TODO: Replace "mock-user-1" with real auth ID when Clerk/Auth is added
  const meetings = useQuery(api.meetings.getMeetings, { userId: "mock-user-1" });
  const folders = useQuery(api.meetings.getFolders, { userId: "mock-user-1" });

  const createMeeting = useMutation(api.meetings.createMeeting);
  const deleteMeeting = useMutation(api.meetings.deleteMeeting);
  const updateMeeting = useMutation(api.meetings.updateMeetingDetails);

  const createFolder = useMutation(api.meetings.createFolder);
  const deleteFolder = useMutation(api.meetings.deleteFolder);

  const [isCreating, setIsCreating] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<any>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleCreateMeeting = async () => {
    try {
      setIsCreating(true);
      const meetingId = await createMeeting({
        title: "New Monthly Meeting",
        venue: "Vision City Hotel",
        userId: "mock-user-1",
      });
      router.push(`/meeting/${meetingId}`);
    } catch (error) {
      console.error("Failed to create meeting:", error);
      setIsCreating(false);
    }
  };

  const handleCreateFolder = async () => {
    const name = prompt("Enter folder name (e.g., 'AGM 2025'):");
    if (!name) return;
    await createFolder({ name, userId: "mock-user-1" });
  }

  const handleDeleteFolder = async (folderId: Id<"folders">) => {
    if (confirm("Delete this folder? Meetings inside will be unclaimed.")) {
      await deleteFolder({ folderId });
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: Id<"meetings">) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this meeting?")) {
      await deleteMeeting({ meetingId: id });
    }
  };

  const handleEdit = (e: React.MouseEvent, meeting: any) => {
    e.stopPropagation();
    setEditingMeeting(meeting);
  };

  const handleSaveEdit = async (id: Id<"meetings">, title: string, venue: string, folderId?: Id<"folders">) => {
    await updateMeeting({
      meetingId: id,
      title,
      venue,
      folderId: folderId || undefined
    });
    setEditingMeeting(null);
  };

  // Grouping Logic
  const organizedMeetings: Record<string, any[]> = {};
  const unorganizedMeetings: any[] = [];

  // 1. Initialize folders
  if (folders) {
    folders.forEach(f => {
      organizedMeetings[f._id] = [];
    });
  }

  // 2. Distribute meetings
  if (meetings) {
    meetings.forEach(m => {
      if (m.folderId && organizedMeetings[m.folderId]) {
        organizedMeetings[m.folderId].push(m);
      } else {
        unorganizedMeetings.push(m);
      }
    });
  }

  // 3. Group unorganized by Year
  const yearGroups = unorganizedMeetings.reduce((acc: any, meeting: any) => {
    const year = new Date(meeting.date).getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(meeting);
    return acc;
  }, {});

  const years = Object.keys(yearGroups).sort((a, b) => Number(b) - Number(a));

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-6 shadow-md">
        <div className="container mx-auto px-8 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-white p-1 rounded-full shrink-0">
              <Image
                src="/lions-logo.png"
                alt="Lions Club Logo"
                width={60}
                height={60}
                className="w-14 h-14 md:w-16 md:h-16 object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">
                Lions' Club AI Secretary
              </h1>
              <p className="text-primary-foreground/80 text-sm mt-0.5 font-medium">
                Meeting Minutes Taker - KL Vision City
              </p>
            </div>
          </div>

          <Button variant="secondary" size="icon" className="rounded-full" onClick={() => setIsSettingsOpen(true)}>
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Action Area */}
      <main className="container mx-auto px-8 mt-8">
        <section className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-slate-800">Your Meetings</h2>
            <div className="flex gap-2">
              <Button
                size="lg"
                onClick={handleCreateFolder}
                className="rounded-full shadow-lg gap-2 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 transition-all font-semibold"
              >
                <Plus className="h-5 w-5" />
                New Folder
              </Button>
              <Button
                size="lg"
                onClick={handleCreateMeeting}
                disabled={isCreating}
                className="rounded-full shadow-lg gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-all font-semibold"
              >
                {isCreating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                New Meeting
              </Button>
            </div>
          </div>

          {meetings === undefined ? (
            <div className="py-12 flex justify-center text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : meetings.length === 0 && (!folders || folders.length === 0) ? (
            <div className="py-12 flex flex-col items-center text-slate-400">
              <p>No meetings found. Create your first one!</p>
            </div>
          ) : (
            <div className="space-y-12">
              {/* 1. Folders */}
              {folders?.map(folder => (
                <div key={folder._id}>
                  <div className="flex items-center justify-between border-b pb-2 mb-4">
                    <h3 className="text-xl font-bold text-slate-700 flex items-center gap-2">
                      <span className="text-2xl">📁</span> {folder.name}
                    </h3>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={() => handleDeleteFolder(folder._id)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {organizedMeetings[folder._id]?.length === 0 && (
                      <div className="col-span-full py-8 text-center text-slate-400 border border-dashed rounded-lg">
                        Empty Folder
                      </div>
                    )}
                    {organizedMeetings[folder._id]?.map((meeting: any) => (
                      <MeetingCard
                        key={meeting._id}
                        meeting={meeting}
                        router={router}
                        handleEdit={handleEdit}
                        handleDelete={handleDelete}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {/* 2. Years (Uncategorized) */}
              {years.map((year) => (
                <div key={year}>
                  <h3 className="text-xl font-bold text-slate-500 mb-4 border-b pb-2">{year} (Uncategorized)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {yearGroups[year].map((meeting: any) => (
                      <MeetingCard
                        key={meeting._id}
                        meeting={meeting}
                        router={router}
                        handleEdit={handleEdit}
                        handleDelete={handleDelete}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <SettingsDialog
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />

        {/* Edit Dialog */}
        {editingMeeting && (
          <EditMeetingDialog
            meeting={editingMeeting}
            folders={folders || []}
            onClose={() => setEditingMeeting(null)}
            onSave={handleSaveEdit}
          />
        )}
      </main>
    </div>
  );
}

/**
 * Renders a meeting card that displays title, date, venue, status badge, a short status description, and actions for editing, deleting, or opening the meeting.
 *
 * @param meeting - Object containing meeting data used to populate the card (expected fields: _id, title, date, venue, status).
 * @param router - Router object with a `push` method for navigating to the meeting view.
 * @param handleEdit - Event handler invoked when the edit action is triggered; receives the event and the meeting object.
 * @param handleDelete - Event handler invoked when the delete action is triggered; receives the event and the meeting `_id`.
 * @returns A React element representing the meeting card.
 */
function MeetingCard({ meeting, router, handleEdit, handleDelete }: any) {
  return (
    <Card className="hover:shadow-md transition-shadow border-slate-200 group relative">
      <CardHeader className="pb-3 pr-12">
        <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-blue-600" onClick={(e) => handleEdit(e, meeting)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={(e) => handleDelete(e, meeting._id)}>
            <Trash className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl text-primary truncate max-w-[80%]">{meeting.title}</CardTitle>
        </div>
        <BadgeStatus status={meeting.status} />
        <CardDescription className="flex items-center gap-2 mt-2">
          <Calendar className="h-4 w-4" />
          {new Date(meeting.date).toLocaleDateString()}
        </CardDescription>
        <CardDescription className="flex items-center gap-2 mt-1">
          <MapPin className="h-4 w-4" />
          {meeting.venue}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="text-sm text-slate-600">
          <p className="line-clamp-2">
            {meeting.status === "FINALIZED"
              ? "Minutes generated and ready for export."
              : meeting.status === "RECORDING"
                ? "Meeting currently in progress..."
                : meeting.status === "FAILED"
                  ? "Processing failed. Try again."
                  : "Processing meeting data..."}
          </p>
        </div>
      </CardContent>
      <CardFooter className="pt-3 border-t bg-slate-50/50">
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => router.push(`/meeting/${meeting._id}`)}
        >
          <FileText className="h-4 w-4" />
          {meeting.status === "FINALIZED" ? "View Minutes" : "Resume Session"}
        </Button>
      </CardFooter>
    </Card>
  )
}

/**
 * Renders a small status badge whose label and visual style correspond to the provided meeting status.
 *
 * The component recognizes common status keys (e.g., `FINALIZED`, `READY_FOR_REVIEW`, `RECORDING`, `PROCESSING`, `PROCESSING_STT`, `PROCESSING_LLM`, `FAILED`) and maps them to user-facing labels and styles; unknown statuses use the raw `status` string as the label and a default processing style.
 *
 * @param status - The status key for the meeting; determines the badge label and color
 * @returns A JSX `span` element containing the styled status badge
 */
function BadgeStatus({ status }: { status: string }) {
  const styles: Record<string, string> = {
    FINALIZED: "bg-green-100 text-green-700 border-green-200",
    READY_FOR_REVIEW: "bg-yellow-100 text-yellow-700 border-yellow-200",
    RECORDING: "bg-red-100 text-red-700 border-red-200 animate-pulse",
    PROCESSING: "bg-blue-100 text-blue-700 border-blue-200",
    PROCESSING_STT: "bg-blue-100 text-blue-700 border-blue-200",
    PROCESSING_LLM: "bg-purple-100 text-purple-700 border-purple-200",
    FAILED: "bg-red-100 text-red-700 border-red-200",
  };

  const labels: Record<string, string> = {
    FINALIZED: "Finalized",
    READY_FOR_REVIEW: "Review Needed",
    RECORDING: "Live",
    PROCESSING: "Processing...",
    PROCESSING_STT: "Transcribing...",
    PROCESSING_LLM: "Generating Minutes...",
  };

  const style = styles[status] || styles.PROCESSING;
  const label = labels[status] || status;

  return (
    <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${style}`}>
      {label}
    </span>
  );
}

/**
 * Renders a modal dialog to edit a meeting's title, venue, and folder assignment.
 *
 * Allows updating the meeting's basic metadata and either saving changes or cancelling.
 *
 * @param meeting - The meeting being edited; must include `_id`, `title`, `venue`, and optional `folderId`.
 * @param folders - Array of folder objects available for assignment; each should include `_id` and `name`.
 * @param onClose - Callback invoked when the dialog is dismissed without saving.
 * @param onSave - Callback invoked when the user saves changes. Called as `onSave(meetingId, title, venue, folderId)`. Use an empty string for `folderId` to mark the meeting as uncategorized.
 * @returns The edit meeting modal as a JSX element.
 */
function EditMeetingDialog({ meeting, folders, onClose, onSave }: any) {
  const [title, setTitle] = useState(meeting.title);
  const [venue, setVenue] = useState(meeting.venue);
  const [folderId, setFolderId] = useState(meeting.folderId || "");

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
        <h3 className="text-lg font-bold mb-4">Edit Meeting Details</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Venue</label>
            <input
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Folder</label>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white"
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
            >
              <option value="">Uncategorized</option>
              {folders.map((f: any) => (
                <option key={f._id} value={f._id}>{f.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(meeting._id, title, venue, folderId)}>Save Changes</Button>
        </div>
      </div>
    </div>
  );
}