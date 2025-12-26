"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, FileText, Calendar, Plus, Settings, Loader2, MapPin, Pencil, Trash, HelpCircle, LogOut } from "lucide-react";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { SettingsDialog } from "@/components/SettingsDialog";
import Image from "next/image";
import { Tutorial } from "@/components/Tutorial";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton, UserButton, useUser, SignedIn, SignedOut } from "@clerk/nextjs";

/**
 * Render the main Dashboard UI for managing meetings, folders, and related actions.
 *
 * Wires data queries and mutations, local UI state, and action handlers used by the dashboard, and renders header, action controls, folder-based and year-based meeting groupings, settings, and edit dialogs.
 *
 * @returns The rendered dashboard JSX element containing header, actions, folder/year groupings, settings dialog, and the edit meeting dialog when active.
 */
export default function Dashboard() {
  const router = useRouter();
  const { user } = useUser();
  const { isAuthenticated } = useConvexAuth();

  // Queries - No arguments needed now as backend uses Auth
  // Queries - Only run when authenticated
  const meetings = useQuery(api.meetings.getMeetings, isAuthenticated ? {} : "skip");
  const folders = useQuery(api.meetings.getFolders, isAuthenticated ? {} : "skip");

  const createMeeting = useMutation(api.meetings.createMeeting);
  const deleteMeeting = useMutation(api.meetings.deleteMeeting);
  const updateMeeting = useMutation(api.meetings.updateMeetingDetails);

  const createFolder = useMutation(api.meetings.createFolder);
  const deleteFolder = useMutation(api.meetings.deleteFolder);

  const [editingMeeting, setEditingMeeting] = useState<any>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Tutorial State
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  // Custom Dialog States
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isCreateMeetingOpen, setIsCreateMeetingOpen] = useState(false);

  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void }>({
    isOpen: false, title: "", message: "", onConfirm: () => { }
  });

  // Auto-open tutorial for new users
  useEffect(() => {
    // Only check if we are authenticated and data is loaded (to avoid flashing)
    if (user && meetings !== undefined) {
      const hasSeenTutorial = localStorage.getItem("hasSeenTutorialV1");
      if (!hasSeenTutorial) {
        // Optional: Auto open. User asked for "tutorial for mom", so maybe better to have it easily accessible requested via button, 
        // but let's auto-show once.
        setIsTutorialOpen(true);
        localStorage.setItem("hasSeenTutorialV1", "true");
      }
    }
  }, [user, meetings]);

  const handleTutorialOpen = () => {
    setIsTutorialOpen(true);
  };

  const handleCreateMeetingClick = () => setIsCreateMeetingOpen(true);

  const handleCreateMeetingSubmit = async (title: string, venue: string, folderId: string) => {
    try {
      const meetingId = await createMeeting({
        title,
        venue,
        // userId is handled by backend auth
        folderId: folderId ? folderId as Id<"folders"> : undefined
      });
      router.push(`/meeting/${meetingId}`);
    } catch (error) {
      console.error("Failed to create meeting:", error);
    }
  };

  const handleCreateFolderClick = () => setIsCreateFolderOpen(true);

  const handleCreateFolderSubmit = async (name: string) => {
    await createFolder({ name });
  };

  const handleDeleteFolder = (folderId: Id<"folders">) => {
    setConfirmConfig({
      isOpen: true,
      title: "Delete Folder?",
      message: "Meetings inside will be unclaimed (uncategorized).",
      onConfirm: async () => await deleteFolder({ folderId })
    });
  };

  const handleDelete = (e: React.MouseEvent, id: Id<"meetings">) => {
    e.stopPropagation();
    setConfirmConfig({
      isOpen: true,
      title: "Delete Meeting?",
      message: "This action cannot be undone.",
      onConfirm: async () => await deleteMeeting({ meetingId: id })
    });
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

  if (folders) {
    folders.forEach(f => {
      organizedMeetings[f._id] = [];
    });
  }

  if (meetings) {
    meetings.forEach(m => {
      if (m.folderId && organizedMeetings[m.folderId]) {
        organizedMeetings[m.folderId].push(m);
      } else {
        unorganizedMeetings.push(m);
      }
    });
  }

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
      <header className="bg-primary text-primary-foreground py-4 md:py-6 shadow-md sticky top-0 z-40">
        <div className="container mx-auto px-4 md:px-8 flex justify-between items-center">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="bg-white p-1 rounded-full shrink-0">
              <Image
                src="/lions-logo.png"
                alt="Lions Club Logo"
                width={60}
                height={60}
                className="w-10 h-10 md:w-16 md:h-16 object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl md:text-3xl font-bold tracking-tight leading-tight">
                AI Secretary
              </h1>
              <p className="text-primary-foreground/80 text-xs md:text-sm mt-0.5 font-medium hidden md:block">
                Lions Club KL Vision City - Meeting Minutes Taker
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <SignedIn>
              {/* Mobile: Icon only */}
              <Button
                variant="secondary"
                size="icon"
                className="md:hidden h-9 w-9"
                onClick={handleTutorialOpen}
                title="Usage Guide"
              >
                <HelpCircle className="h-5 w-5" />
              </Button>
              {/* Desktop: Full button with text */}
              <Button
                variant="secondary"
                size="sm"
                className="hidden md:flex gap-2 text-xs md:text-sm"
                onClick={handleTutorialOpen}
              >
                <HelpCircle className="h-4 w-4" /> Usage Guide
              </Button>
              <div className="bg-white/10 p-1 rounded-full">
                <UserButton afterSignOutUrl="/" />
              </div>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="secondary" size="sm">Sign In</Button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 md:px-8 mt-8">

        <AuthLoading>
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-slate-500">Loading your workspace...</p>
          </div>
        </AuthLoading>

        <SignedOut>
          <div className="animate-in fade-in slide-in-from-bottom-5 duration-500">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <div className="bg-white p-6 md:p-10 rounded-2xl shadow-xl max-w-3xl mx-auto border border-slate-100">
                <div className="relative w-32 h-32 md:w-40 md:h-40 mx-auto mb-6">
                  <Image src="/assets/avatar/1.png" fill className="object-contain" alt="Welcome" />
                </div>
                <h2 className="text-2xl md:text-4xl font-bold text-slate-800 mb-4">
                  Welcome to Your <span className="text-primary">AI Secretary!</span>
                </h2>
                <p className="text-slate-600 mb-6 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
                  Transform your meeting recordings into professional minutes in seconds.
                  No more tedious note-taking — let AI handle the hard work for you.
                </p>
                <SignInButton mode="modal">
                  <Button size="lg" className="text-lg px-10 py-6 rounded-full shadow-lg hover:shadow-xl transition-all bg-primary hover:bg-primary/90">
                    🚀 Get Started Free
                  </Button>
                </SignInButton>
              </div>
            </div>

            {/* How It Works Section */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 md:p-10 mb-12">
              <h3 className="text-xl md:text-2xl font-bold text-slate-700 text-center mb-8">
                📖 How It Works — Step by Step
              </h3>

              <div className="space-y-6 max-w-3xl mx-auto">
                {/* Step 1 */}
                <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 mb-1">Create a New Meeting</h4>
                    <p className="text-slate-600 text-sm">
                      Click <strong>"New Meeting"</strong> on your dashboard. Give it a title, venue, and optionally assign it to a folder.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 mb-1">Add Context (Optional)</h4>
                    <p className="text-slate-600 text-sm">
                      Paste your <strong>meeting agenda</strong> beforehand. This helps the AI structure your minutes more accurately.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 mb-1">Mark Attendance</h4>
                    <p className="text-slate-600 text-sm">
                      Check the boxes for <strong>members who are present</strong>. This list will be included in your exported document.
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg">
                    4
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 mb-1">Upload Your Audio</h4>
                    <p className="text-slate-600 text-sm">
                      Drag & drop your recording file (MP3, WAV, M4A). The AI will start processing immediately.
                    </p>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg">
                    5
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 mb-1">Wait for AI Processing</h4>
                    <p className="text-slate-600 text-sm">
                      The status will show <strong>Transcribing → Generating Minutes</strong>. This usually takes 30-60 seconds for a 1-hour meeting.
                    </p>
                  </div>
                </div>

                {/* Step 6 */}
                <div className="flex items-start gap-4 p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-bold text-green-800 mb-1">Review & Export!</h4>
                    <p className="text-green-700 text-sm">
                      Once ready, review your minutes on screen. If satisfied, click <strong>"Export DOCX"</strong> to download your professionally formatted document!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Final CTA */}
            <div className="text-center pb-10">
              <p className="text-slate-600 mb-4 text-lg">Ready to save hours on every meeting?</p>
              <SignInButton mode="modal">
                <Button size="lg" className="text-lg px-10 py-6 rounded-full shadow-lg hover:shadow-xl transition-all">
                  🦁 Start Using AI Secretary
                </Button>
              </SignInButton>
            </div>
          </div>
        </SignedOut>

        <SignedIn>
          <section className="mb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <h2 className="text-2xl font-semibold text-slate-800 flex items-center gap-2">
                Your Meetings
                {meetings && (
                  <span className="text-sm font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    {meetings.length}
                  </span>
                )}
              </h2>
              <div className="flex gap-2 w-full md:w-auto">
                <Button
                  id="btn-new-folder"
                  size="lg"
                  onClick={handleCreateFolderClick}
                  className="flex-1 md:flex-none rounded-full shadow-sm gap-2 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 transition-all font-semibold"
                >
                  <Plus className="h-5 w-5" />
                  Folder
                </Button>
                <Button
                  id="btn-new-meeting"
                  size="lg"
                  onClick={handleCreateMeetingClick}
                  className="flex-1 md:flex-none rounded-full shadow-lg gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-semibold"
                >
                  <Plus className="h-5 w-5" />
                  New Meeting
                </Button>
              </div>
            </div>

            {meetings === undefined ? (
              <div className="py-12 flex justify-center text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : meetings.length === 0 && (!folders || folders.length === 0) ? (
              <div className="py-12 flex flex-col items-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200 p-10">
                <div className="relative w-32 h-32 mb-4 opacity-80">
                  <Image src="/assets/avatar/2.png" fill className="object-contain" alt="Empty State" />
                </div>
                <p className="text-lg font-medium text-slate-600">No meetings yet!</p>
                <p className="text-sm mb-6">Create a new meeting to get started.</p>
                <Button onClick={handleTutorialOpen} variant="outline">Show Me How</Button>
              </div>
            ) : (
              <div className="space-y-12">
                {/* 1. Folders */}
                {folders?.map(folder => (
                  <div key={folder._id}>
                    <div className="flex items-center justify-between border-b pb-2 mb-4">
                      <h3 className="text-lg md:text-xl font-bold text-slate-700 flex items-center gap-2">
                        <span className="text-2xl">📁</span> {folder.name}
                      </h3>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={() => handleDeleteFolder(folder._id)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                      {organizedMeetings[folder._id]?.length === 0 && (
                        <div className="col-span-full py-8 text-center text-slate-400 border border-dashed rounded-lg bg-white/50">
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
                    <h3 className="text-lg md:text-xl font-bold text-slate-500 mb-4 border-b pb-2">{year} (Uncategorized)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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

          <Tutorial isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} />

          <SettingsDialog
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
          />

          <CreateFolderDialog
            isOpen={isCreateFolderOpen}
            onClose={() => setIsCreateFolderOpen(false)}
            onCreate={handleCreateFolderSubmit}
          />

          <CreateMeetingDialog
            isOpen={isCreateMeetingOpen}
            onClose={() => setIsCreateMeetingOpen(false)}
            onCreate={handleCreateMeetingSubmit}
            folders={folders || []}
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
        </SignedIn>

        <ConfirmDialog
          isOpen={confirmConfig.isOpen}
          title={confirmConfig.title}
          message={confirmConfig.message}
          onConfirm={confirmConfig.onConfirm}
          onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        />
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
    <Card className="hover:shadow-md transition-shadow border-slate-200 group relative flex flex-col h-full">
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
          <CardTitle className="text-lg md:text-xl text-primary truncate max-w-[85%]">{meeting.title}</CardTitle>
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
      <CardContent className="pb-3 flex-grow">
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

function CreateFolderDialog({ isOpen, onClose, onCreate }: { isOpen: boolean; onClose: () => void; onCreate: (name: string) => Promise<void> }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    await onCreate(name);
    setLoading(false);
    setName("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
        <h3 className="text-lg font-bold mb-4">Create New Folder</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">Folder Name</label>
            <input
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="e.g. AGM 2025"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Folder"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}


function CreateMeetingDialog({ isOpen, onClose, onCreate, folders }: { isOpen: boolean; onClose: () => void; onCreate: (title: string, venue: string, folderId: string) => Promise<void>; folders: any[] }) {
  const [title, setTitle] = useState("New Monthly Meeting");
  const [venue, setVenue] = useState("Vision City Hotel");
  const [folderId, setFolderId] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !venue.trim()) return;

    setLoading(true);
    await onCreate(title, venue, folderId);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
        <h3 className="text-lg font-bold mb-4">Create New Meeting</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Meeting Title</label>
            <input
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="e.g. Board Meeting Oct 2025"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Venue</label>
            <input
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="e.g. Conference Room A"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Folder (Optional)</label>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white"
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
            >
              <option value="">Uncategorized</option>
              {folders?.map((f: any) => (
                <option key={f._id} value={f._id}>{f.name}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading || !title.trim() || !venue.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start Recording"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmDialog({ isOpen, onClose, title, message, onConfirm }: { isOpen: boolean; onClose: () => void; title: string; message: string; onConfirm: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-slate-600 mb-6">{message}</p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={() => { onConfirm(); onClose(); }}>Confirm</Button>
        </div>
      </div>
    </div>
  );
}
