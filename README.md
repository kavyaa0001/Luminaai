# Lumina AI - Advanced Video Learning Analyzer

## 🚀 Vercel Deployment Guide

To deploy this project to Vercel, follow these steps:

### 1. Database Setup (CRITICAL)
Vercel's serverless environment is ephemeral, meaning `data.json` will reset every time the server sleeps. 
**For production, you MUST use a cloud database.**
1. Go to [Neon.tech](https://neon.tech/) and create a free Postgres database.
2. Copy the `DATABASE_URL` (Connection String).

### 2. Vercel Configuration
1. Connect your GitHub repository to Vercel.
2. In the **Project Settings**:
   - **Root Directory**: Leave it as the root of the repo.
   - **Build Command**: `pnpm build`
   - **Install Command**: `pnpm install`
3. Add the following **Environment Variables**:
   - `GEMINI_API_KEY`: Your Google Gemini API Key.
   - `DATABASE_URL`: Your Neon/Vercel Postgres connection string.
   - `NODE_ENV`: `production`

### 3. Deploy
Click **Deploy**. Vercel will build both the frontend and the backend automatically using the `vercel.json` routing.

---

# AI Video Learning Analyzer Platform

An AI-powered web platform that transforms passive video watching into an active, measurable learning experience. Paste a YouTube link, get a quiz — track what you know and what you need to work on.

---

## Features

### Core
- **YouTube URL Input** — Paste any YouTube link to extract and analyze video content
- **AI Transcript Generation** — Automatically generates an educational transcript using OpenAI GPT
- **Content Analysis** — Identifies key topics and produces a structured summary
- **Automatic MCQ Generation** — Creates 8–12 multiple-choice questions with explanations
- **Interactive Quiz** — One-question-at-a-time interface with progress tracking
- **Performance Evaluation** — Score, percentage, correct/incorrect breakdown after submission
- **Topic-Based Weakness Analysis** — Maps each question to a topic; shows strong vs. weak areas

### Dashboard
- Overall stats: total sessions, quizzes taken, average score, best score
- Topic-level mastery breakdown (strong / moderate / weak)
- Recent activity feed across all sessions

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| State / Data | TanStack React Query |
| Routing | Wouter |
| Backend | Express 5 + Node.js |
| Database | PostgreSQL + Drizzle ORM |
| AI | OpenAI GPT (via Replit AI Integrations) |
| API Contract | OpenAPI 3.1 + Orval codegen |
| Monorepo | pnpm workspaces |

---

## Project Structure

```
ai-video-analysier/
├── artifacts/
│   ├── api-server/          # Express 5 API server
│   │   └── src/
│   │       ├── routes/      # sessions.ts, dashboard.ts, health.ts
│   │       └── lib/
│   │           └── ai-analysis.ts   # OpenAI transcript + question generation
│   └── video-learning/      # React + Vite frontend
│       └── src/
│           └── pages/       # Home, Sessions, Quiz, Results, Dashboard
├── lib/
│   ├── api-spec/            # OpenAPI 3.1 spec (openapi.yaml)
│   ├── api-client-react/    # Generated React Query hooks
│   ├── api-zod/             # Generated Zod validation schemas
│   ├── db/                  # Drizzle ORM schema + DB connection
│   └── integrations-openai-ai-server/  # OpenAI SDK wrapper
├── pnpm-workspace.yaml
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL database (or use Replit's built-in DB)
- OpenAI API access (or Replit AI Integrations)

### Environment Variables

```env
DATABASE_URL=postgresql://...
AI_INTEGRATIONS_OPENAI_BASE_URL=https://...
AI_INTEGRATIONS_OPENAI_API_KEY=...
SESSION_SECRET=your-secret-here
```

### Installation

```bash
# Install dependencies
pnpm install

# Push database schema
pnpm --filter @workspace/db run push

# Run codegen (generates React Query hooks from OpenAPI spec)
pnpm --filter @workspace/api-spec run codegen
```

### Development

```bash
# Start the API server (runs on PORT env var)
pnpm --filter @workspace/api-server run dev

# Start the frontend (runs on PORT env var)
pnpm --filter @workspace/video-learning run dev
```

---

## API Overview

All routes are prefixed with `/api`.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/sessions` | List all learning sessions |
| POST | `/sessions` | Create a new session (YouTube URL or video URL) |
| GET | `/sessions/:id` | Get session details + questions |
| DELETE | `/sessions/:id` | Delete a session |
| POST | `/sessions/:id/analyze` | Trigger AI analysis (transcript + quiz generation) |
| POST | `/sessions/:id/quiz` | Submit quiz answers, get scored result |
| GET | `/sessions/:id/attempts` | List all quiz attempts for a session |
| GET | `/dashboard/summary` | Overall learning stats |
| GET | `/dashboard/topic-analysis` | Topic-level accuracy breakdown |
| GET | `/dashboard/recent-activity` | Recent sessions and quiz completions |

---

## How It Works

1. **User pastes a YouTube URL** on the home page
2. A session is created in the database (`status: pending`)
3. The `/analyze` endpoint is called — triggers AI processing in the background:
   - GPT generates a realistic educational transcript for the video
   - GPT analyzes the transcript and returns a summary, key topics, and 8–12 MCQs
   - Questions are saved to the database; session status set to `ready`
4. **User takes the quiz** — answers are submitted to `/sessions/:id/quiz`
5. The backend scores each answer, calculates topic-level accuracy, and saves the attempt
6. **Results page** shows score, correct/incorrect answers with explanations, strong and weak topics
7. **Dashboard** aggregates all attempts to show learning progress over time

---

## Database Schema

### `sessions`
Stores each video session with its transcript, summary, key topics, and processing status.

### `questions`
Stores AI-generated MCQs linked to a session, with all four options, the correct answer, topic tag, and explanation.

### `attempts`
Stores each quiz attempt with score, percentage, per-answer details, and strong/weak topic lists.

---

## License

MIT
