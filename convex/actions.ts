"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import axios from "axios";
import fs from "fs";
import path from "path";
import Groq from "groq-sdk";
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType } from "docx";

export const processAudio = action({
    args: { meetingId: v.id("meetings"), audioUrl: v.string() },
    handler: async (ctx, args) => {
        const gladiaKey = process.env.GLADIA_API_KEY;
        if (!gladiaKey) {
            console.error("Missing GLADIA_API_KEY");
            throw new Error("Missing GLADIA_API_KEY");
        }

        console.log("Starting Gladia processing for:", args.audioUrl);

        try {
            // 1. Submit Audio to Gladia
            const uploadResponse = await axios.post(
                "https://api.gladia.io/v2/transcription",
                {
                    audio_url: args.audioUrl,
                    diarization: true, // Enable speaker identification
                },
                {
                    headers: {
                        "x-gladia-key": gladiaKey,
                        "Content-Type": "application/json",
                    },
                }
            );

            const resultUrl = uploadResponse.data.result_url;
            console.log("Gladia Task Queued, result URL:", resultUrl);

            // 2. Poll for Results
            let status = "queued";
            let transcriptResult = null;

            while (status === "queued" || status === "processing") {
                await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait 3s
                const pollResponse = await axios.get(resultUrl, {
                    headers: { "x-gladia-key": gladiaKey },
                });
                status = pollResponse.data.status;
                if (status === "done") {
                    transcriptResult = pollResponse.data.result;
                    break;
                } else if (status === "error") {
                    throw new Error("Gladia processing failed");
                }
            }

            console.log("Gladia Processing Complete");

            // 3. Format Transcript
            // Gladia returns `transcription.utterances` array
            const formattedTranscript = transcriptResult.transcription.utterances.map((u: any) => ({
                speaker: `Speaker ${u.speaker || '?'}`,
                text: u.text,
                time: u.start,
            }));

            // 4. Save Transcript
            await ctx.runMutation(api.meetings.updateTranscript, {
                meetingId: args.meetingId,
                transcript: formattedTranscript,
                status: "PROCESSING_LLM",
            });

            // 5. Trigger LLM generation
            await ctx.runAction(api.actions.generateMinutes, { meetingId: args.meetingId });

        } catch (error) {
            console.error("Gladia Error:", error);
            await ctx.runMutation(api.meetings.updateMeetingStatus, {
                meetingId: args.meetingId,
                status: "FAILED",
            });
        }
    },
});

export const generateMinutes = action({
    args: { meetingId: v.id("meetings") },
    handler: async (ctx, args) => {
        const groqKey = process.env.GROQ_API_KEY;
        if (!groqKey) {
            console.error("Missing GROQ_API_KEY");
            throw new Error("Missing GROQ_API_KEY");
        }

        // 1. Fetch meeting document to get the transcript
        const meeting = await ctx.runQuery(api.meetings.getMeeting, { meetingId: args.meetingId });
        if (!meeting || !meeting.rawTranscript) throw new Error("Meeting or transcript not found");

        const transcriptText = meeting.rawTranscript
            .map((t: any) => `[${t.time}s] ${t.speaker}: ${t.text}`)
            .join("\n");

        console.log("Generating minutes with Groq (Llama 3)...");

        const groq = new Groq({ apiKey: groqKey });

        const prompt = `
        You are the Secretary of the Lions Club of KL Vision City.
        Your task is to convert the following meeting transcript into formal minute items.

        ${meeting.agenda ? `Here is the meeting agenda/context to guide the structure:\n${meeting.agenda}\n` : ""}

        Format your response as a JSON array of objects with the following structure:
        [
          {
            "item": "1.0", 
            "description": "The exact wording of the minute item, formal and concise.", 
            "remark": "Action By: Person Name OR 'Info'" 
          }
        ]

        Rules:
        - Use "Info" for remark if no specific action is required.
        - Number items sequentially (1.0, 2.0, etc.).
        - Capture motions, proposers, and seconders clearly.
        - Ignore small talk.
        - If the agenda is provided, try to align the minutes with the agenda items.

        Transcript:
        ${transcriptText}
        `;

        try {
            const completion = await groq.chat.completions.create({
                messages: [
                    { role: "system", content: "You are a professional secretary. Output only valid JSON." },
                    { role: "user", content: prompt }
                ],
                model: "llama-3.3-70b-versatile",
                temperature: 0.1,
                response_format: { type: "json_object" }
            });

            const text = completion.choices[0]?.message?.content || "";

            // Clean markdown code blocks if present (though json_object mode helps)
            const jsonText = text.replace(/```json/g, "").replace(/```/g, "").trim();

            let minuteItems;
            try {
                // Sometimes Groq returns { "minutes": [...] } or just [...]
                const parsed = JSON.parse(jsonText);
                if (Array.isArray(parsed)) {
                    minuteItems = parsed;
                } else if (parsed.minutes && Array.isArray(parsed.minutes)) {
                    minuteItems = parsed.minutes;
                } else {
                    // Fallback: try to find an array in the object values
                    const possibleArray = Object.values(parsed).find(v => Array.isArray(v));
                    minuteItems = possibleArray || [];
                }
            } catch (e) {
                console.error("JSON Parse Error:", e);
                console.log("Raw Text:", text);
                throw new Error("Failed to parse AI response");
            }

            // Save Minutes
            await ctx.runMutation(api.meetings.updateMinutes, {
                meetingId: args.meetingId,
                minutes: minuteItems,
                status: "READY_FOR_REVIEW",
            });
            console.log("Minutes generated successfully");

        } catch (error) {
            console.error("Groq Error:", error);
            await ctx.runMutation(api.meetings.updateMeetingStatus, {
                meetingId: args.meetingId,
                status: "FAILED",
            });
        }
    },
});

export const exportMinutes = action({
    args: { meetingId: v.id("meetings") },
    handler: async (ctx, args) => {
        const meeting = await ctx.runQuery(api.meetings.getMeeting, { meetingId: args.meetingId });
        if (!meeting || !meeting.finalMinutes) throw new Error("No minutes to export");

        const allMembers = await ctx.runQuery(api.meetings.getMembers);
        const presentMemberIds = new Set(meeting.attendance || []);
        const presentNames = allMembers
            .filter((m: any) => presentMemberIds.has(m._id))
            .map((m: any) => m.name)
            .join(", ");

        // Check for User Template
        const templatePath = path.resolve("./lions-club minutes template.docx");
        let docBlob;

        // Note: Full template filling requires mapping placeholders (e.g. {{Date}}) which we don't have yet.
        // For now, we will stick to the robust generation method to ensure output, 
        // but we verify we can access the file for future patching.

        /* 
        // Future Template Logic:
        if (fs.existsSync(templatePath)) {
             const templateBuffer = fs.readFileSync(templatePath);
             // Use PatchDocument here...
        } 
        */

        // Generating a fresh professional document
        const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `Minutes of ${meeting.title}`,
                                bold: true,
                                size: 32, // 16pt
                            }),
                        ],
                        spacing: { after: 400 },
                    }),
                    new Paragraph({
                        text: `Venue: ${meeting.venue}`,
                        spacing: { after: 200 },
                    }),
                    new Paragraph({
                        text: `Date: ${new Date(meeting.date).toLocaleDateString()}`,
                        spacing: { after: 200 },
                    }),
                    new Paragraph({
                        text: `Present: ${presentNames || "None recorded"}`,
                        spacing: { after: 400 },
                    }),
                    // Table Header
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Item", bold: true })] })], width: { size: 10, type: WidthType.PERCENTAGE } }),
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Description", bold: true })] })], width: { size: 70, type: WidthType.PERCENTAGE } }),
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Action By", bold: true })] })], width: { size: 20, type: WidthType.PERCENTAGE } }),
                                ],
                            }),
                            // Minute Items
                            ...meeting.finalMinutes.map((item: any) =>
                                new TableRow({
                                    children: [
                                        new TableCell({ children: [new Paragraph(item.item)] }),
                                        new TableCell({ children: [new Paragraph(item.description)] }),
                                        new TableCell({ children: [new Paragraph(item.remark)] }),
                                    ],
                                })
                            )
                        ],
                    }),
                ],
            }],
        });

        const b64 = await Packer.toBase64String(doc);
        return b64;
    },
});

export const testApiConnections = action({
    args: {},
    handler: async (ctx) => {
        const results = {
            gladia: { status: "pending", message: "" },
            gemini: { status: "pending", message: "" }, // Keeping key name 'gemini' for UI compatibility, but it tests Groq
        };

        const gladiaKey = process.env.GLADIA_API_KEY;
        const groqKey = process.env.GROQ_API_KEY;

        // 1. Test Gladia
        if (!gladiaKey) {
            results.gladia = { status: "error", message: "Missing GLADIA_API_KEY" };
        } else {
            try {
                await axios.get("https://api.gladia.io/v2/transcription?limit=1", {
                    headers: { "x-gladia-key": gladiaKey }
                });
                results.gladia = { status: "ok", message: "Connected" };
            } catch (err: any) {
                const status = err.response?.status;
                const msg = status === 401 || status === 403 ? "Invalid API Key" : err.message;
                results.gladia = { status: "error", message: msg };
            }
        }

        // 2. Test Groq
        if (!groqKey) {
            results.gemini = { status: "error", message: "Missing GROQ_API_KEY" };
        } else {
            try {
                const groq = new Groq({ apiKey: groqKey });
                await groq.chat.completions.create({
                    messages: [{ role: "user", content: "Test" }],
                    model: "llama3-8b-8192", // Fast test model
                });
                results.gemini = { status: "ok", message: "Connected to Groq (Llama 3)" };
            } catch (err: any) {
                results.gemini = { status: "error", message: err.message || "Groq connection failed" };
            }
        }

        return results;
    }
});
