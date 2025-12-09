import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        name: v.string(),
        email: v.string(),
    }),

    roster: defineTable({
        userId: v.string(), // Temporarily string, usually v.id("users") if using auth, but keeping simple for now
        name: v.string(),
        initials: v.string(),
        position: v.string(),
        isMember: v.boolean(),
    }).index("by_user", ["userId"]),

    meetings: defineTable({
        userId: v.string(),
        title: v.string(),
        date: v.number(),
        venue: v.string(),
        audioFileUrl: v.string(),
        status: v.string(), // 'RECORDING', 'PROCESSING_STT', 'PROCESSING_LLM', 'READY_FOR_REVIEW', 'FINALIZED'
        rawTranscript: v.array(v.object({
            speaker: v.string(),
            text: v.string(),
            time: v.number(),
        })),
        finalMinutes: v.optional(v.array(v.object({
            item: v.string(),
            description: v.string(),
            remark: v.string(),
        }))),
    }).index("by_status", ["status"]),
});
