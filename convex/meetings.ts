import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// --- Member Management ---

export const createMember = mutation({
    args: {
        name: v.string(),
        role: v.string(),
        email: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("members", args);
    },
});

export const getMembers = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("members").collect();
    },
});

export const deleteMember = mutation({
    args: { memberId: v.id("members") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.memberId);
    },
});


// --- Folder Management ---

export const createFolder = mutation({
    args: {
        name: v.string(),
        userId: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("folders", args);
    },
});

export const getFolders = query({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("folders")
            .filter((q) => q.eq(q.field("userId"), args.userId))
            .collect();
    },
});

export const deleteFolder = mutation({
    args: { folderId: v.id("folders") },
    handler: async (ctx, args) => {
        // Optional: delete or unlink meetings in this folder?
        // For now, let's just delete the folder. Meetings will become "Uncategorized".
        const meetings = await ctx.db
            .query("meetings")
            .withIndex("by_folder", (q) => q.eq("folderId", args.folderId))
            .collect();

        for (const meeting of meetings) {
            await ctx.db.patch(meeting._id, { folderId: undefined });
        }

        await ctx.db.delete(args.folderId);
    },
});


// --- Meeting Management ---

export const deleteMeeting = mutation({
    args: { meetingId: v.id("meetings") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.meetingId);
    },
});

export const updateMeetingStatus = mutation({
    args: {
        meetingId: v.id("meetings"),
        status: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.meetingId, { status: args.status });
    },
});

export const updateMeetingDetails = mutation({
    args: {
        meetingId: v.id("meetings"),
        title: v.optional(v.string()),
        venue: v.optional(v.string()),
        date: v.optional(v.number()),
        attendance: v.optional(v.array(v.id("members"))),
        agenda: v.optional(v.string()),
        folderId: v.optional(v.id("folders")),
    },
    handler: async (ctx, args) => {
        const { meetingId, ...fields } = args;
        await ctx.db.patch(meetingId, fields);
    },
});

// --- Existing Mutations ---

export const createMeeting = mutation({
    args: {
        title: v.string(),
        venue: v.string(),
        userId: v.string(), // Mock user ID for now
        folderId: v.optional(v.id("folders")),
    },
    handler: async (ctx, args) => {
        const meetingId = await ctx.db.insert("meetings", {
            title: args.title,
            date: Date.now(),
            venue: args.venue,
            userId: args.userId,
            folderId: args.folderId,
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

export const getMeeting = query({
    args: { meetingId: v.id("meetings") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.meetingId);
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

        // Schedule the action to process audio (moved to actions.ts)
        await ctx.scheduler.runAfter(0, api.actions.processAudio, {
            meetingId: args.meetingId,
            audioUrl: url,
        });
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
