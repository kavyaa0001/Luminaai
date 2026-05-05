import fs from "fs";
import path from "path";

export interface Session {
  id: number;
  title: string;
  youtubeUrl: string | null;
  videoUrl: string | null;
  requestedQuestionCount?: number;
  status: string;
  transcript: string | null;
  summary: string | null;
  keyTopics: string[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: number;
  sessionId: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: "A" | "B" | "C" | "D";
  topic: string;
  explanation: string;
  timestamp?: string;
  createdAt: string;
}

export interface Attempt {
  id: number;
  sessionId: number;
  score: number;
  totalQuestions: number;
  percentage: number;
  strongTopics: string[];
  weakTopics: string[];
  answers: any[];
  createdAt: string;
}

export interface DatabaseSchema {
  sessions: Session[];
  questions: Question[];
  attempts: Attempt[];
  nextSessionId: number;
  nextQuestionId: number;
  nextAttemptId: number;
}

const dbPath = path.join(process.cwd(), "data.json");

function initDb(): DatabaseSchema {
  if (!fs.existsSync(dbPath)) {
    const initialDb: DatabaseSchema = {
      sessions: [],
      questions: [],
      attempts: [],
      nextSessionId: 1,
      nextQuestionId: 1,
      nextAttemptId: 1,
    };
    fs.writeFileSync(dbPath, JSON.stringify(initialDb, null, 2), "utf8");
    return initialDb;
  }
  try {
    const raw = fs.readFileSync(dbPath, "utf8");
    return JSON.parse(raw) as DatabaseSchema;
  } catch (e) {
    console.error("Failed to parse data.json, returning empty DB");
    return {
      sessions: [],
      questions: [],
      attempts: [],
      nextSessionId: 1,
      nextQuestionId: 1,
      nextAttemptId: 1,
    };
  }
}

export const jsonDb = {
  data: initDb(),
  save() {
    fs.writeFileSync(dbPath, JSON.stringify(this.data, null, 2), "utf8");
  }
};
