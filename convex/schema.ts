import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        name: v.string(),
        email: v.string(),
    }),

    members: defineTable({
        name: v.string(),
        role: v.string(), // e.g. "President", "Secretary"
        email: v.optional(v.string()),
    }),

    folders: defineTable({
        name: v.string(), // e.g. "2025 Meetings", "Board Meetings"
        userId: v.string(),
    }),

    meetings: defineTable({
        userId: v.string(),
        title: v.string(),
        date: v.number(),
        venue: v.string(),
        audioFileUrl: v.string(),
        folderId: v.optional(v.id("folders")), // Organize meetings into folders
        status: v.string(), // 'RECORDING', 'PROCESSING_STT', 'PROCESSING_LLM', 'READY_FOR_REVIEW', 'FINALIZED'
        rawTranscript: v.array(v.object({
            speaker: v.string(),
            text: v.string(),
            time: v.number(),
        })),
        attendance: v.optional(v.array(v.id("members"))), // List of IDs of members present
        agenda: v.optional(v.string()), // Meeting Agenda/Context
        finalMinutes: v.optional(v.array(v.object({
            item: v.string(),
            description: v.string(),
            remark: v.string(),
        }))),
    }).index("by_status", ["status"]).index("by_folder", ["folderId"]),
});
