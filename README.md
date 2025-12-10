# Lions' AI Secretary 🦁

![Lions Club Logo](/public/lions-icon.png)

**Lions' AI Secretary** is a powerful, automated minutes-taking application designed specifically for the **Lions Club of KL Vision City**. It drastically reduces the administrative burden on the club secretary by transforming raw meeting audio recordings into structured, formal minutes in seconds.

Built with **Next.js**, **Convex**, and cutting-edge AI (**Llama 3 via Groq** + **Gladia**).

## 🚀 Features

-   **🎙️ Automated Transcription**: Upload your meeting recording (MP3/WAV/M4A), and our robust AI pipeline transcribes it with speaker identification.
-   **🤖 AI Minute Generation**: The system intelligently parses the transcript, ignores small talk, captures motions/proposals, and formats them into a formal Meeting Minutes table.
-   **📂 Smart Organization**: Group meetings by Year or Folder to keep your historical records tidy.
-   **👥 Attendance Tracking**: Manage your Club Member roster and easily check off attendees for each meeting. The exported document automatically lists all names present.
-   **📄 Instant Export**: One-click download of a professionally formatted `.docx` file, ready to be emailed to members.
-   **📝 Context-Aware**: You can input the Meeting Agenda beforehand to guide the AI in structuring the minutes correctly.

## 🛠️ Setup & Installation

### Prerequisites
-   Node.js 18+
-   npm or yarn
-   A [Convex](https://convex.dev) account.
-   A [Groq](https://groq.com) API Key (for LLM).
-   A [Gladia](https://gladia.io) API Key (for Transcription).

### 1. Clone & Install
```bash
git clone https://github.com/YourUsername/ai-secretary.git
cd ai-secretary
npm install
```

### 2. Configure Environment
1.  Initialize Convex:
    ```bash
    npx convex dev
    ```
    This will prompt you to log in and create a project.

2.  Set up Environment Variables in your **Convex Dashboard**:
    -   Go to `Settings > Environment Variables`.
    -   Add `GLADIA_API_KEY`: Your Gladia Key.
    -   Add `GROQ_API_KEY`: Your Groq Key.

### 3. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to check it out.

## 📖 How to Use

1.  **Create a Meeting**: Click "New Meeting" on the dashboard.
2.  **Add Context**: (Optional) Paste your Agenda in the "Agenda & Context" box.
3.  **Mark Attendance**: Check the boxes for members who are present.
4.  **Upload Audio**: Drag & drop your recording file.
5.  **Wait**:
    -   Status will go from `UPLOADING` -> `PROCESSING_AUDIO` -> `PROCESSING_LLM`.
    -   This usually takes 30-60 seconds for a 1-hour meeting (thanks to Groq!).
6.  **Review & Export**: Once status is `READY_FOR_REVIEW`, read the minutes on screen. If satisfied, click **"Export DOCX"**.

## 🏗️ Architecture

For a deep dive into the code structure, database schema, and AI pipeline, please read [TECHNICAL.md](./TECHNICAL.md).

## 🛡️ License

Private project for Lions Club of KL Vision City.
