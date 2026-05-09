import { Router } from "express";
// @ts-ignore
import * as DB from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";

const router = Router();
const db = (DB as any).db;
const sessionsTable = (DB as any).sessionsTable;
const questionsTable = (DB as any).questionsTable;
const attemptsTable = (DB as any).attemptsTable;

router.get("/dashboard/summary", async (_req: any, res: any): Promise<void> => {
  try {
    const sessionsCount = await db.select({ count: sql<number>`count(*)` }).from(sessionsTable);
    const attempts = await db.select().from(attemptsTable);
    
    const totalSessions = Number(sessionsCount[0].count);
    const totalQuizzesTaken = attempts.length;
    
    let totalPercentage = 0;
    let bestScore = 0;
    let totalQuestionsAnswered = 0;
    let totalCorrect = 0;

    for (const a of attempts) {
      totalPercentage += a.percentage;
      if (a.percentage > bestScore) bestScore = a.percentage;
      totalQuestionsAnswered += a.totalQuestions;
      totalCorrect += a.score;
    }

    const averageScore = totalQuizzesTaken > 0 ? totalPercentage / totalQuizzesTaken : 0;
    const overallAccuracy = totalQuestionsAnswered > 0 ? (totalCorrect / totalQuestionsAnswered) * 100 : 0;

    res.json({
      totalSessions,
      totalQuizzesTaken,
      averageScore: Math.round(averageScore * 10) / 10,
      bestScore: Math.round(bestScore * 10) / 10,
      totalQuestionsAnswered,
      overallAccuracy: Math.round(overallAccuracy * 10) / 10,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch dashboard summary" });
  }
});

router.get("/dashboard/topic-analysis", async (_req: any, res: any): Promise<void> => {
  try {
    const attempts = await db.select().from(attemptsTable);
    const topicStats = new Map<string, { correct: number; total: number }>();

    for (const attempt of attempts) {
      const answers = attempt.answers as Array<{
        topic: string;
        isCorrect: boolean;
      }>;

      if (!Array.isArray(answers)) continue;

      for (const answer of answers) {
        if (!answer.topic) continue;
        if (!topicStats.has(answer.topic)) {
          topicStats.set(answer.topic, { correct: 0, total: 0 });
        }
        const stats = topicStats.get(answer.topic)!;
        stats.total++;
        if (answer.isCorrect) stats.correct++;
      }
    }

    const topicAnalysis = Array.from(topicStats.entries()).map(([topic, stats]) => {
      const accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
      let status: "strong" | "moderate" | "weak";
      if (accuracy >= 70) status = "strong";
      else if (accuracy >= 40) status = "moderate";
      else status = "weak";

      return {
        topic,
        totalQuestions: stats.total,
        correctAnswers: stats.correct,
        accuracy: Math.round(accuracy * 10) / 10,
        status,
      };
    });

    topicAnalysis.sort((a, b) => b.accuracy - a.accuracy);
    res.json(topicAnalysis);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch topic analysis" });
  }
});

router.get("/dashboard/recent-activity", async (_req: any, res: any): Promise<void> => {
  try {
    const attempts = await db.select().from(attemptsTable).orderBy(desc(attemptsTable.createdAt)).limit(10);
    const sessions = await db.select().from(sessionsTable).orderBy(desc(sessionsTable.createdAt)).limit(10);

    const activity: Array<{
      type: "session_created" | "quiz_completed" | "analysis_done";
      sessionId: number;
      sessionTitle: string;
      score: number | null;
      percentage: number | null;
      createdAt: any;
    }> = [];

    for (const a of attempts) {
      const session = await db.query.sessionsTable.findFirst({
        where: eq(sessionsTable.id, a.sessionId),
      });
      activity.push({
        type: "quiz_completed",
        sessionId: a.sessionId,
        sessionTitle: session?.title ?? "Unknown",
        score: a.score,
        percentage: a.percentage,
        createdAt: a.createdAt,
      });
    }

    for (const s of sessions) {
      if (s.status === "ready") {
        activity.push({
          type: "analysis_done",
          sessionId: s.id,
          sessionTitle: s.title,
          score: null,
          percentage: null,
          createdAt: s.updatedAt,
        });
      }
      activity.push({
        type: "session_created",
        sessionId: s.id,
        sessionTitle: s.title,
        score: null,
        percentage: null,
        createdAt: s.createdAt,
      });
    }

    activity.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(activity.slice(0, 15));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch recent activity" });
  }
});

router.get("/dashboard/mistakes", async (_req: any, res: any): Promise<void> => {
  try {
    const attempts = await db.select().from(attemptsTable).orderBy(desc(attemptsTable.createdAt));
    const mistakes: any[] = [];

    for (const attempt of attempts) {
      if (mistakes.length >= 10) break;
      
      const answers = attempt.answers as Array<{
        questionId: number;
        isCorrect: boolean;
        selectedOption: string;
      }>;

      if (!Array.isArray(answers)) continue;

      for (const answer of answers) {
        if (!answer.isCorrect) {
          const question = await db.query.questionsTable.findFirst({
            where: eq(questionsTable.id, answer.questionId),
          });
          const session = await db.query.sessionsTable.findFirst({
            where: eq(sessionsTable.id, attempt.sessionId),
          });
          
          if (question && session) {
            mistakes.push({
              id: question.id,
              questionText: question.questionText,
              correctOption: question.correctOption,
              userAnswer: answer.selectedOption,
              explanation: question.explanation,
              timestamp: question.timestamp,
              sessionId: session.id,
              sessionTitle: session.title,
              youtubeUrl: session.youtubeUrl,
              createdAt: attempt.createdAt
            });
          }
        }
        if (mistakes.length >= 10) break;
      }
    }

    res.json(mistakes);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch mistakes" });
  }
});

export default router;
