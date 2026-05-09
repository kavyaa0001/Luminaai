import { Router, type IRouter } from "express";
import { db, sessionsTable, questionsTable, attemptsTable } from "@workspace/db";
import { eq, desc, count } from "drizzle-orm";
import { processSession } from "../lib/ai-analysis.js";

const router = Router();

router.get("/sessions", async (_req, res) => {
  try {
    const sessions = await db.query.sessionsTable.findMany({
      orderBy: [desc(sessionsTable.createdAt)],
    });

    const sessionsWithCount = await Promise.all(sessions.map(async (s) => {
      const qCountResult = await db.select({ count: count() })
        .from(questionsTable)
        .where(eq(questionsTable.sessionId, s.id));
      return { ...s, questionCount: qCountResult[0].count };
    }));

    res.json(sessionsWithCount);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

router.post("/sessions", async (req, res) => {
  const { title, youtubeUrl, videoUrl, questionCount } = req.body;
  if (!title) {
    res.status(400).json({ error: "title is required" });
    return;
  }

  try {
    const [session] = await db.insert(sessionsTable).values({
      title,
      youtubeUrl: youtubeUrl ?? null,
      videoUrl: videoUrl ?? null,
      requestedQuestionCount: questionCount ? parseInt(questionCount, 10) : 10,
      status: "pending",
    }).returning();

    res.status(201).json({ ...session, questionCount: 0 });
  } catch (error) {
    res.status(500).json({ error: "Failed to create session" });
  }
});

router.get("/sessions/:id", async (req, res) => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  
  try {
    const session = await db.query.sessionsTable.findFirst({
      where: eq(sessionsTable.id, id),
      with: {
        questions: true,
      }
    });
    
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    // @ts-ignore - drizzle with relations might have different structure
    const questions = session.questions || [];

    res.json({
      ...session,
      questionCount: questions.length,
      questions,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch session" });
  }
});

router.delete("/sessions/:id", async (req, res) => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  
  try {
    const result = await db.delete(sessionsTable).where(eq(sessionsTable.id, id)).returning();
    
    if (result.length === 0) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ error: "Failed to delete session" });
  }
});

router.post("/sessions/:id/analyze", async (req, res) => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  
  try {
    const session = await db.query.sessionsTable.findFirst({
      where: eq(sessionsTable.id, id),
    });
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    await processSession(id);
    
    const updatedSession = await db.query.sessionsTable.findFirst({
      where: eq(sessionsTable.id, id),
      with: {
        questions: true,
      }
    });
    
    // @ts-ignore
    const questions = updatedSession?.questions || [];
    res.json({ ...updatedSession, questionCount: questions.length, questions });
  } catch (error: any) {
    console.error("Analysis error:", error);
    
    await db.update(sessionsTable)
      .set({ status: "failed" })
      .where(eq(sessionsTable.id, id));
    
    if (error.status === 429) {
      res.status(429).json({ 
        error: "AI Quota Exceeded", 
        details: "The Gemini AI API quota has been reached. Please wait a moment or use your own API key." 
      });
      return;
    }
    
    if (error.status === 403) {
      res.status(403).json({ 
        error: "AI Key Invalid", 
        details: "The Gemini API key is invalid or has been reported as leaked. Please provide a valid API key in your environment variables." 
      });
      return;
    }
    
    res.status(500).json({ error: "Failed to analyze session", details: error.message });
  }
});

router.post("/sessions/:id/quiz", async (req, res) => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { answers } = req.body;
  if (!answers || !Array.isArray(answers)) {
    res.status(400).json({ error: "answers array is required" });
    return;
  }

  try {
    const questions = await db.select().from(questionsTable).where(eq(questionsTable.sessionId, id));
    if (questions.length === 0) {
      res.status(404).json({ error: "No questions found" });
      return;
    }

    const questionMap = new Map(questions.map((q) => [q.id, q]));

    const evaluatedAnswers = answers.map((a: any) => {
      const question = questionMap.get(a.questionId);
      if (!question) return null;
      return {
        questionId: a.questionId,
        selectedOption: a.selectedOption,
        correctOption: question.correctOption,
        isCorrect: a.selectedOption === question.correctOption,
        topic: question.topic,
      };
    }).filter(Boolean);

    const score = evaluatedAnswers.filter((a: any) => a.isCorrect).length;
    const totalQuestions = evaluatedAnswers.length;
    const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;

    const topicPerformance = new Map<string, { total: number; correct: number }>();
    for (const ans of evaluatedAnswers) {
      if (!ans) continue;
      const stats = topicPerformance.get(ans.topic) || { total: 0, correct: 0 };
      stats.total++;
      if (ans.isCorrect) stats.correct++;
      topicPerformance.set(ans.topic, stats);
    }

    const strongTopics = [];
    const weakTopics = [];
    for (const [topic, stats] of topicPerformance.entries()) {
      const topicPercentage = (stats.correct / stats.total) * 100;
      if (topicPercentage >= 70) strongTopics.push(topic);
      else weakTopics.push(topic);
    }

    const [attempt] = await db.insert(attemptsTable).values({
      sessionId: id,
      score,
      totalQuestions,
      percentage,
      strongTopics,
      weakTopics,
      answers: evaluatedAnswers,
    }).returning();

    res.json(attempt);
  } catch (error) {
    res.status(500).json({ error: "Failed to submit quiz" });
  }
});

router.get("/sessions/:id/attempts", async (req, res) => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  try {
    const attempts = await db.select().from(attemptsTable)
      .where(eq(attemptsTable.sessionId, id))
      .orderBy(desc(attemptsTable.createdAt));
    res.json(attempts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch attempts" });
  }
});

export default router;
