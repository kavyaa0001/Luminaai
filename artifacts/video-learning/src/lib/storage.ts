const STORAGE_KEY = "lumina_sessions";

export interface LocalQuestion {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: "A" | "B" | "C" | "D";
  topic: string;
  explanation: string;
}

export interface LocalSession {
  id: string;
  youtubeUrl: string;
  summary: string;
  keyTopics: string[];
  questions: LocalQuestion[];
  score?: number;
  totalQuestions?: number;
  timestamp: number;
}

export function saveSession(sessionData: Omit<LocalSession, "id" | "timestamp">) {
  const sessions = getSessions();
  const newSession: LocalSession = {
    ...sessionData,
    id: Date.now().toString(),
    timestamp: Date.now()
  };
  sessions.unshift(newSession);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, 50))); // Keep last 50
  return newSession;
}

export function getSessions(): LocalSession[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function getSessionById(id: string): LocalSession | undefined {
  return getSessions().find(s => s.id === id);
}

export function updateSessionScore(id: string, score: number, totalQuestions: number) {
  const sessions = getSessions();
  const sessionIndex = sessions.findIndex(s => s.id === id);
  if (sessionIndex !== -1) {
    sessions[sessionIndex].score = score;
    sessions[sessionIndex].totalQuestions = totalQuestions;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }
}
