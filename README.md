# 🦁 Lions' Minute Master

An AI-powered automated secretary for Lions Club meetings. This application records meetings, identifies speakers, and automatically generates official minutes in the standard Lions Club 3-column format.

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+
- [Convex Account](https://convex.dev) (for Backend/DB)
- Gladia API Key (for Audio Intelligence)
- Gemini API Key (for LLM Extraction)

### 2. Installation
```bash
npm install
```

### 3. Setup Environment
Create a `.env.local` file (optional for UI demo, required for full functionality):
```env
# Convex
CONVEX_DEPLOYMENT=...
NEXT_PUBLIC_CONVEX_URL=...

# AI Services (Add these to your Convex Dashboard Environment Variables)
GLADIA_API_KEY=...
GEMINI_API_KEY=...
```

### 4. Initialize Backend (Convex)
```bash
npx convex dev
```
*Note: This will prompt you to log in and will generate the necessary type definitions in `convex/_generated`. Without this, the backend files will show type errors.*

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🏗️ Architecture
- **Frontend**: Next.js 14, Tailwind CSS, Shadcn UI
- **Backend**: Convex (Database, Serverless Functions, Storage)
- **AI**: Gladia (Diarization), Gemini 2.5 (Structure Extraction)

## 🦁 Feature Set (V1)
- **Dashboard**: View past meetings and statuses.
- **Recorder**: Big Red Button interface with live visualizer.
- **Minutes Editor**: Split-pane view (Transcript vs Minutes) for rapid review.
- **Export**: Generates `.docx` files formatted for club records.

## ⚠️ Vibe Coding Notes
This project is currently scaffolded with **Mock Data** in the UI components to demonstrate the UX flow without needing active backend connections. 
- To connect the real backend, uncomment the `useQuery` hooks in `app/page.tsx` and implementation in `convex/meetings.ts`.
