import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// --- Mutations & Queries ---

export const createMeeting = mutation({
    args: {
        title: v.string(),
        venue: v.string(),
        userId: v.string(), // Mock user ID for now
    },
    handler: async (ctx, args) => {
        const meetingId = await ctx.db.insert("meetings", {
            title: args.title,
            date: Date.now(),
            venue: args.venue,
            userId: args.userId,
            audioFileUrl: "",
            status: "RECORDING",
            rawTranscript: [],
        });
        return meetingId;
    },
});

export const getMeetings = query({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("meetings")
            .filter((q) => q.eq(q.field("userId"), args.userId))
            .collect();
    },
});

export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        return await ctx.storage.generateUploadUrl();
    },
});

export const updateMeetingAudio = mutation({
    args: { meetingId: v.id("meetings"), storageId: v.id("_storage") },
    handler: async (ctx, args) => {
        const url = await ctx.storage.getUrl(args.storageId);
        if (!url) throw new Error("Failed to get download URL");

        await ctx.db.patch(args.meetingId, {
            audioFileUrl: url,
            status: "PROCESSING_STT",
        });
        // Trigger the action to process audio
        // In a real app, you'd schedule this. Here we rely on the client or a scheduler.
    },
});

export const updateTranscript = mutation({
    args: {
        meetingId: v.id("meetings"),
        transcript: v.array(v.object({ speaker: v.string(), text: v.string(), time: v.number() })),
        status: v.string()
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.meetingId, {
            rawTranscript: args.transcript,
            status: args.status,
        });
    },
});

export const updateMinutes = mutation({
    args: {
        meetingId: v.id("meetings"),
        minutes: v.array(v.object({ item: v.string(), description: v.string(), remark: v.string() })),
        status: v.string()
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.meetingId, {
            finalMinutes: args.minutes,
            status: args.status,
        });
    },
});


// --- Actions (Stubbed) ---

export const processAudio = action({
    args: { meetingId: v.id("meetings"), audioUrl: v.string() },
    handler: async (ctx, args) => {
        // 1. Call Gladia API (Stub)
        console.log("Processing audio from:", args.audioUrl);

        // Mock response
        const mockTranscript = [
            { speaker: "Speaker 1", text: "I call this meeting to order.", time: 0 },
            { speaker: "Speaker 2", text: "Apologies from Lion John.", time: 5 },
            { speaker: "Speaker 1", text: "Let's confirm the minutes.", time: 10 },
        ];

        await ctx.runMutation(api.meetings.updateTranscript, {
            meetingId: args.meetingId,
            transcript: mockTranscript,
            status: "PROCESSING_LLM",
        });

        // 2. Trigger LLM generation
        await ctx.runAction(api.meetings.generateMinutes, { meetingId: args.meetingId });
    },
});

export const generateMinutes = action({
    args: { meetingId: v.id("meetings") },
    handler: async (ctx, args) => {
        // 1. Fetch transcript (needs a query or just passed in, but let's assume we fetch it or it's context aware)
        // For now, we mock the LLM output
        const mockMinutes = [
            { item: "1", description: "Meeting called to order by Pres. Mary", remark: "Info" },
            { item: "2", description: "Apologies received from Lion John", remark: "Info" },
            { item: "3", description: "Minutes of previous meeting confirmed. Proposer: Lion A, Seconder: Lion B", remark: "Info" },
        ];

        await ctx.runMutation(api.meetings.updateMinutes, {
            meetingId: args.meetingId,
            minutes: mockMinutes,
            status: "READY_FOR_REVIEW",
        });
    },
});
