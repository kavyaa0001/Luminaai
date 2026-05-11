import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "./logger.js";
import { db, sessionsTable, questionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { YoutubeTranscript } from "youtube-transcript";

function getModel() {
  if (!process.env.GEMINI_API_KEY) return null;
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({ model: "gemini-flash-latest" });
}

interface GeneratedQuestion {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: "A" | "B" | "C" | "D";
  topic: string;
  explanation: string;
  timestamp?: string;
}

interface AnalysisResult {
  summary: string;
  keyTopics: string[];
  questions: GeneratedQuestion[];
}

export async function extractYouTubeTranscript(youtubeUrl: string): Promise<string> {
  const videoId = extractYouTubeVideoId(youtubeUrl);
  if (!videoId) throw new Error("Invalid YouTube URL");

  try {
    let transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
    return transcriptItems.slice(0, 300).map(item => item.text).join(" ");
  } catch (error) {
    return `Content about video ${videoId}. Please analyze based on the title and topic.`;
  }
}

export async function analyzeTranscript(transcript: string, questionCount: number = 10): Promise<AnalysisResult> {
  const model = getModel();
  if (!model) throw new Error("GEMINI_API_KEY is missing");

  const prompt = `Analyze this transcript and return ONLY a JSON object:
  {
    "summary": "2 sentence summary",
    "keyTopics": ["topic1", "topic2"],
    "questions": [{"questionText": "...", "optionA": "...", "optionB": "...", "optionC": "...", "optionD": "...", "correctOption": "A", "topic": "...", "explanation": "..."}]
  }
  Generate exactly ${questionCount} questions.
  Transcript: ${transcript.substring(0, 10000)}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Invalid AI response");
  return JSON.parse(jsonMatch[0]) as AnalysisResult;
}

export async function processSession(sessionId: number): Promise<void> {
  const session = await db.query.sessionsTable.findFirst({ where: eq(sessionsTable.id, sessionId) });
  if (!session) return;

  await db.update(sessionsTable).set({ status: "processing" }).where(eq(sessionsTable.id, sessionId));

  try {
    const transcript = session.youtubeUrl ? await extractYouTubeTranscript(session.youtubeUrl) : "Manual video content";
    const analysis = await analyzeTranscript(transcript, session.requestedQuestionCount || 10);

    await db.update(sessionsTable).set({ 
      status: "ready",
      transcript,
      summary: analysis.summary,
      keyTopics: analysis.keyTopics,
      updatedAt: new Date()
    }).where(eq(sessionsTable.id, sessionId));

    if (analysis.questions?.length > 0) {
      await db.insert(questionsTable).values(analysis.questions.map(q => ({
        sessionId,
        ...q
      })));
    }
  } catch (error) {
    await db.update(sessionsTable).set({ status: "failed" }).where(eq(sessionsTable.id, sessionId));
    throw error;
  }
}

function extractYouTubeVideoId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}
