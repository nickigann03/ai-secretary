# 🔧 Technical Documentation

> Architecture and flow diagrams for Lions' Club AI Secretary

---

## 📐 System Architecture

```mermaid
flowchart TB
    subgraph Frontend["Frontend (Next.js 14)"]
        DASH[Dashboard Page]
        MR[Meeting Recorder]
        ME[Minutes Editor]
        SD[Settings Dialog]
        API_CLIENT[Convex React Client]
    end

    subgraph Backend["Backend (Convex)"]
        ACT[server/actions.ts]
        MUT[server/mutations.ts]
        QRY[server/queries.ts]
        SCH[Database Schema]
        STO[File Storage]
        CRON[Cron Jobs]
    end

    subgraph External["External APIs"]
        GLADIA[Gladia API<br/>(Speech-to-Text)]
        GROQ[Groq API<br/>(LLM / Llama 3)]
    end

    subgraph DB["Convex Database"]
        MEETINGS[(Meetings Table)]
        FOLDERS[(Folders Table)]
        MEMBERS[(Members Table)]
    end

    DASH --> |Queries| QRY
    DASH --> |Mutations| MUT
    MR --> |Mutations| MUT
    MR --> |File Upload| STO
    ME --> |Queries| QRY
    ME --> |Actions| ACT

    ACT --> |Fetch| GLADIA
    ACT --> |Chat| GROQ
    
    MUT --> SCH
    QRY --> SCH
    SCH --> MEETINGS
    SCH --> FOLDERS
    SCH --> MEMBERS

    ACT --> |Save| MEETINGS
```

---

## 🎮 User Flow

```mermaid
flowchart LR
    subgraph Dashboard["1. Dashboard"]
        A[View Meetings] --> |Click New| B[Create Meeting]
        B --> |Input Info| C[Recorder Page]
    end
    
    subgraph Recording["2. Recording Session"]
        C --> D[Start Record]
        D --> E[Pause/Resume]
        E --> F[Stop]
        F --> G{Review}
        G --> |Discard| D
        G --> |Save| H[Process Audio]
    end
    
    subgraph Processing["3. AI Processing"]
        H --> I[Upload to Convex]
        I --> J[Trigger Action]
        J --> K[Gladia Transcribe]
        K --> L[Groq Generate Minutes]
        L --> M[Store Results]
    end
    
    subgraph Editing["4. Review & Export"]
        M --> N[Minutes Editor]
        N --> O[Listen & Verify]
        O --> P[Edit Items]
        P --> Q[Save Draft]
        Q --> R[Export DOCX]
    end
```

---

## 🤖 Feature: Audio Processing Flow

```mermaid
sequenceDiagram
    participant FE as Frontend (Recorder)
    participant CX as Convex (Backend)
    participant ST as Convex Storage
    participant GL as Gladia (STT)
    participant GQ as Groq (LLM)

    Note over FE: User stops recording
    FE->>CX: generateUploadUrl()
    CX-->>FE: uploadUrl
    
    FE->>ST: POST audio/webm blob
    ST-->>FE: storageId
    
    FE->>CX: updateMeetingAudio(storageId)
    CX->>CX: scheduler.runAfter(0, processAudio)
    
    Note over CX: Background Action Starts
    
    CX->>ST: getUrl(storageId)
    ST-->>CX: publicUrl
    
    CX->>GL: GET /transcription/?audio_url=...
    GL-->>CX: { transcription: [...] }
    
    CX->>CX: patch(meetingId, { transcript })
    
    CX->>GQ: Chat Completion (System Prompt + Transcript)
    GQ-->>CX: JSON { minutes: [...] }
    
    CX->>CX: patch(meetingId, { finalMinutes, status: "READY" })
```

---

## ⚔️ Template Export System

```mermaid
flowchart TB
    subgraph Input["Data Source"]
        M[Meeting Data]
        T[Transcript]
        D[Date/Venue]
        P[Present Members]
    end
    
    subgraph Template["Template Engine"]
        DOC[lions-club-minutes-template.docx]
        ZIP[PizZip]
        ENG[Docxtemplater]
    end
    
    subgraph Logic["Processing Logic"]
        READ[Read Template]
        MAP[Map Data to Tags]
        RENDER[Render Document]
        FAIL{Template Exists?}
    end
    
    subgraph Output["Output"]
        GEN[Generated .docx Blob]
        FALL[Fallback Manual Generation]
    end
    
    M --> MAP
    READ --> FAIL
    FAIL --> |Yes| ZIP
    FAIL --> |No| FALL
    
    ZIP --> ENG
    MAP --> ENG
    ENG --> RENDER
    RENDER --> GEN
```

---

## 🏗️ Folder Structure

```mermaid
graph TD
    ROOT[ai-secretary/]
    
    subgraph App["/app (Next.js)"]
        PAGE[page.tsx<br/>(Dashboard)]
        MEETING_PAGE[meeting/[id]/page.tsx]
        LAYOUT[layout.tsx]
        GLOBALS[globals.css]
    end

    subgraph Convex["/convex (Backend)"]
        SCHEMA[schema.ts]
        ACTIONS[actions.ts]
        MEETINGS[meetings.ts]
    end

    subgraph Components["/components"]
        UI[ui/<br/>(Shadcn Components)]
        REC[MeetingRecorder.tsx]
        EDIT[MinutesEditor.tsx]
        SET[SettingsDialog.tsx]
    end
    
    ROOT --> App
    ROOT --> Convex
    ROOT --> Components
```

---

## 📊 Data Models

```mermaid
erDiagram
    MEETINGS {
        id _id
        string title
        string venue
        number date
        id folderId
        string audioFileUrl
        string status
        json rawTranscript
        json finalMinutes
    }
    
    FOLDERS {
        id _id
        string name
        string userId
    }
    
    MEMBERS {
        id _id
        string name
        string role
        string email
    }
    
    TRANSCRIPT_ITEM {
        string speaker
        string text
        number time
    }
    
    MINUTE_ITEM {
        string item
        string description
        string remark
    }
    
    MEETINGS ||--o{ TRANSCRIPT_ITEM : contains
    MEETINGS ||--o{ MINUTE_ITEM : produces
    FOLDERS ||--o{ MEETINGS : organizes
    MEMBERS ||--o{ MEETINGS : attends
```

---

## 🔐 Environment Variables

```mermaid
flowchart TB
    subgraph Client["Client Side (.env.local)"]
        C1[NEXT_PUBLIC_CONVEX_URL]
    end
    
    subgraph Server["Convex Dashboard"]
        S1[GLADIA_API_KEY]
        S2[GROQ_API_KEY]
    end
    
    subgraph Usage["Usage"]
        U1[Convex Client Provider]
        U2[convex/actions.ts]
    end
    
    C1 --> U1
    S1 --> U2
    S2 --> U2
```

---

<p align="center">
  <b>Built for Lions Club KL Vision City</b>
</p>
