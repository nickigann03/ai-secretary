# TECHNICAL.md - Lions' AI Secretary

## System Architecture

The Lion's AI Secretary is built on a modern, serverless architecture leveraging **Convex** for the backend and database, and **Next.js 14** (App Router) for the frontend. It integrates deeply with advanced AI services (**Groq/Llama 3** and **Gladia**) to automate the transcription and meaningful summarization of audio recordings.

### Tech Stack

#### Core Framework
-   **Frontend**: Next.js 14 (React, TypeScript) with Tailwind CSS for styling.
-   **Backend**: Convex (BaaS) - Provides real-time database, serverless functions (queries/mutations/actions), and file storage.
-   **Language**: TypeScript throughout the entire stack for end-to-end type safety.

#### AI & Processing Pipeline
1.  **Audio Transcription**: **Gladia API**.
    -   We use Gladia's V2 transcription endpoint for high-fidelity speech-to-text.
    -   Features enabled: Speaker Diarization (identifying who spoke), timestamp alignment.
2.  **Minutes Generation**: **Groq API** (Llama 3.3-70b-Versatile).
    -   The raw transcript is fed into Meta's Llama 3 model running on Groq's LPU (Language Processing Unit) infrastructure.
    -   We prompt the model to act as a professional secretary, converting informal speech into structured, formal minute items (Item No, Description, Action By).
3.  **Document Generation**: **docx** (JS Library).
    -   Minutes are programmatically converted into a downloadable `.docx` file in the browser using the server-side generated data.

### Database Schema (Convex)

The database is schema-enforced via `convex/schema.ts`.

**`meetings` Table**
-   `_id`: Unique Identifier.
-   `title`: Meeting Title (String).
-   `date`: Meeting Date (String/ISO).
-   `venue`: Location (String).
-   `folderId`: Link to `folders` table (Optional).
-   `audioFileId`: Reference to Convex File Storage (for the uploaded recording).
-   `status`: Enum (`"UPLOADING"`, `"PROCESSING_AUDIO"`, `"PROCESSING_LLM"`, `"READY_FOR_REVIEW"`, `"COMPLETED"`, `"FAILED"`).
-   `transcript`: Array of objects `{ speaker, text, time }`.
-   `rawTranscript`: Unformatted raw text dump (for debugging/re-processing).
-   `finalMinutes`: JSON Structure of the generated minutes `{ item, description, remark }`.
-   `attendance`: Array of Member IDs (References to `members` table).

**`members` Table**
-   `_id`: Unique Identifier.
-   `name`: Member Name (String).
-   `role`: Member Role (e.g., "President", "Secretary").
-   `status`: Active status (Boolean).

**`folders` Table**
-   `_id`: Unique Identifier.
-   `name`: Folder Name (e.g., "Fiscal Year 2024").

### Key Workflows

#### 1. Audio Upload & Processing
*   **Trigger**: User uploads a file in `MeetingRecorder.tsx`.
*   **Action**: `api.meetings.generateUploadUrl` gets a signed URL.
*   **Mutation**: `api.meetings.saveMeeting` stores the file ID and initial status.
*   **Action Chain**:
    1.  `api.actions.processAudio`: Sends audio URL to Gladia.
    2.  Polls Gladia until completion.
    3.  Saves transcript to `meetings` table.
    4.  Triggers `api.actions.generateMinutes`.

#### 2. AI Summarization
*   **Trigger**: Completion of Audio Processing.
*   **Action**: `api.actions.generateMinutes`.
*   **Logic**:
    1.  Fetches meeting transcript.
    2.  Constructs a prompt with Meeting Context (Agenda) + Transcript.
    3.  Sends to Groq (Llama 3.3).
    4.  Parses JSON response.
    5.  Updates `meetings` table with `finalMinutes`.

#### 3. Export
*   **Trigger**: User clicks "Export DOCX".
*   **Action**: Client-side logic calls `api.actions.exportMinutes`.
*   **Logic**:
    1.  Generates a Word Document structure using the `docx` library in a Server Action.
    2.  Populates "Present" list by cross-referencing `attendance` IDs with `members` names.
    3.  Formats the table with Minute Items.
    4.  Returns a Base64 string of the file to the client for download.

### Environment Variables
| Variable | Description |
| :--- | :--- |
| `CONVEX_DEPLOYMENT` | Convex Project ID. |
| `NEXT_PUBLIC_CONVEX_URL` | Public URL for the Convex backend. |
| `GLADIA_API_KEY` | Key for Gladia Audio Transcription service. |
| `GROQ_API_KEY` | Key for Groq AI service (Llama 3). |

### Future Improvements / Roadmap
-   [ ] **PDF Export**: Add support for PDF generation alongside DOCX.
-   [ ] **Template injection**: Allow users to upload a `.docx` template and inject variables (`{{date}}`, `{{content}}`) instead of generating a generic table.
-   [ ] **Search**: Vector search on transcripts to find "Who said what?" across all historical meetings.
