import { Router, type IRouter } from "express";
import { jsonDb } from "../lib/json-db";
import { processSession } from "../lib/ai-analysis";

const router: IRouter = Router();

router.get("/sessions", async (_req, res) => {
  const sessionsWithCount = jsonDb.data.sessions.map(s => {
    const qCount = jsonDb.data.questions.filter(q => q.sessionId === s.id).length;
    return { ...s, questionCount: qCount };
  });
  sessionsWithCount.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(sessionsWithCount);
});

router.post("/sessions", async (req, res) => {
  const { title, youtubeUrl, videoUrl } = req.body;
  if (!title) {
    return res.status(400).json({ error: "title is required" });
  }

  const session = {
    id: jsonDb.data.nextSessionId++,
    title,
    youtubeUrl: youtubeUrl ?? null,
    videoUrl: videoUrl ?? null,
    status: "pending",
    summary: null,
    keyTopics: null,
    transcript: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  jsonDb.data.sessions.push(session);
  jsonDb.save();

  res.status(201).json({ ...session, questionCount: 0 });
});

router.get("/sessions/:id", async (req, res) => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const session = jsonDb.data.sessions.find(s => s.id === id);
  
  if (!session) return res.status(404).json({ error: "Session not found" });

  const questions = jsonDb.data.questions.filter(q => q.sessionId === id);

  res.json({
    ...session,
    questionCount: questions.length,
    questions,
  });
});

router.delete("/sessions/:id", async (req, res) => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const initialLength = jsonDb.data.sessions.length;
  jsonDb.data.sessions = jsonDb.data.sessions.filter(s => s.id !== id);
  jsonDb.data.questions = jsonDb.data.questions.filter(q => q.sessionId !== id);
  jsonDb.save();
  
  if (jsonDb.data.sessions.length === initialLength) {
    return res.status(404).json({ error: "Session not found" });
  }
  res.sendStatus(204);
});

router.post("/sessions/:id/analyze", async (req, res) => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const session = jsonDb.data.sessions.find(s => s.id === id);
  if (!session) return res.status(404).json({ error: "Session not found" });

  try {
    await processSession(id);
    const updatedSession = jsonDb.data.sessions.find(s => s.id === id);
    const questions = jsonDb.data.questions.filter(q => q.sessionId === id);
    res.json({ ...updatedSession, questionCount: questions.length, questions });
  } catch (error: any) {
    console.error("Analysis error:", error);
    if (session) {
      session.status = "failed";
      jsonDb.save();
    }
    res.status(500).json({ error: "Failed to analyze session", details: error.message });
  }
});

router.post("/sessions/:id/quiz", async (req, res) => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { answers } = req.body;
  if (!answers || !Array.isArray(answers)) return res.status(400).json({ error: "answers array is required" });

  const questions = jsonDb.data.questions.filter(q => q.sessionId === id);
  if (questions.length === 0) return res.status(404).json({ error: "No questions found" });

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

  const attempt = {
    id: jsonDb.data.nextAttemptId++,
    sessionId: id,
    score,
    totalQuestions,
    percentage,
    strongTopics,
    weakTopics,
    answers: evaluatedAnswers,
    createdAt: new Date().toISOString(),
  };

  jsonDb.data.attempts.push(attempt);
  jsonDb.save();

  res.json(attempt);
});

router.get("/sessions/:id/attempts", async (req, res) => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const attempts = jsonDb.data.attempts.filter(a => a.sessionId === id);
  res.json(attempts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
});

export default router;
