"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, FileText, Calendar, Clock, Plus, Settings } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

// Mock Data for UI Demonstration
const MOCK_MEETINGS = [
  {
    _id: "1",
    title: "December Monthly Meeting",
    date: Date.now() - 86400000 * 2,
    venue: "Vision City Hotel",
    status: "FINALIZED",
  },
  {
    _id: "2",
    title: "AGM Planning Committee",
    date: Date.now() - 86400000 * 10,
    venue: "Zoom",
    status: "READY_FOR_REVIEW",
  },
];

export default function Dashboard() {
  const [meetings] = useState(MOCK_MEETINGS);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-6 shadow-md">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Lions' Minute Master</h1>
            <p className="text-primary-foreground/80 text-sm mt-1">Lions Club of KL Vision City</p>
          </div>
          <Button variant="secondary" size="icon" className="rounded-full">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Action Area */}
      <main className="container mx-auto px-4 mt-8">
        <section className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-slate-800">Your Meetings</h2>
            <Button size="lg" className="rounded-full shadow-lg gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-all font-semibold">
              <Plus className="h-5 w-5" />
              New Meeting
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* New Meeting Card - Prominent */}
            <Card className="border-2 border-dashed border-slate-300 bg-slate-50/50 hover:bg-slate-100 hover:border-primary/50 transition-all cursor-pointer group flex flex-col items-center justify-center p-8 h-full min-h-[200px]">
              <div className="rounded-full bg-primary/10 p-4 group-hover:bg-primary/20 transition-colors mb-4">
                <Mic className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700">Record New Meeting</h3>
              <p className="text-sm text-slate-500 text-center mt-2">Start a recording or upload an audio file</p>
            </Card>

            {/* List of Meetings */}
            {meetings.map((meeting) => (
              <Card key={meeting._id} className="hover:shadow-md transition-shadow border-slate-200">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl text-primary">{meeting.title}</CardTitle>
                    <BadgeStatus status={meeting.status} />
                  </div>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(meeting.date).toLocaleDateString()}
                    <span className="mx-1">•</span>
                    <span className="flex items-center gap-1">
                      {meeting.venue}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="text-sm text-slate-600">
                    <p className="line-clamp-2">
                      Meeting recording processed.
                      {meeting.status === "FINALIZED" ? "Minutes generated and ready for export." : "Minutes pending review."}
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="pt-3 border-t bg-slate-50/50">
                  <Button variant="outline" className="w-full gap-2">
                    <FileText className="h-4 w-4" />
                    {meeting.status === "FINALIZED" ? "View Minutes" : "Resume Review"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function BadgeStatus({ status }: { status: string }) {
  const styles: Record<string, string> = {
    FINALIZED: "bg-green-100 text-green-700 border-green-200",
    READY_FOR_REVIEW: "bg-yellow-100 text-yellow-700 border-yellow-200",
    RECORDING: "bg-red-100 text-red-700 border-red-200 animate-pulse",
    PROCESSING: "bg-blue-100 text-blue-700 border-blue-200",
  };

  const labels: Record<string, string> = {
    FINALIZED: "Finalized",
    READY_FOR_REVIEW: "Review Needed",
    RECORDING: "Live",
    PROCESSING: "Processing AI...",
  };

  const style = styles[status] || styles.PROCESSING;
  const label = labels[status] || status;

  return (
    <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${style}`}>
      {label}
    </span>
  );
}
