import { Router, type IRouter } from "express";
import { jsonDb } from "../lib/json-db";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const totalSessions = jsonDb.data.sessions.length;
  const attempts = jsonDb.data.attempts;
  
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
});

router.get("/dashboard/topic-analysis", async (_req, res): Promise<void> => {
  const attempts = jsonDb.data.attempts;
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
});

router.get("/dashboard/recent-activity", async (_req, res): Promise<void> => {
  const attempts = [...jsonDb.data.attempts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);
  const sessions = [...jsonDb.data.sessions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  const activity: Array<{
    type: "session_created" | "quiz_completed" | "analysis_done";
    sessionId: number;
    sessionTitle: string;
    score: number | null;
    percentage: number | null;
    createdAt: string;
  }> = [];

  for (const a of attempts) {
    const session = jsonDb.data.sessions.find(s => s.id === a.sessionId);
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
});

router.get("/dashboard/mistakes", async (_req, res): Promise<void> => {
  const attempts = [...jsonDb.data.attempts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const mistakes: any[] = [];

  for (const attempt of attempts) {
    if (mistakes.length >= 10) break;
    
    const answers = attempt.answers as Array<{
      questionId: number;
      isCorrect: boolean;
      userAnswer: string;
    }>;

    if (!Array.isArray(answers)) continue;

    for (const answer of answers) {
      if (!answer.isCorrect) {
        const question = jsonDb.data.questions.find(q => q.id === answer.questionId);
        const session = jsonDb.data.sessions.find(s => s.id === attempt.sessionId);
        
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
});

export default router;
